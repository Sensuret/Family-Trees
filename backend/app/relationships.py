from collections import deque

from sqlalchemy.orm import Session

from .models import FamilyMember


def find_relationship(
    db: Session, member1_id: int, member2_id: int, family_id: int
) -> tuple[str, list[str]]:
    if member1_id == member2_id:
        return "Self", ["Self"]

    members: dict[int, FamilyMember] = {}
    all_members = db.query(FamilyMember).filter(FamilyMember.family_id == family_id).all()
    for m in all_members:
        members[m.id] = m

    if member1_id not in members or member2_id not in members:
        return "Not related", []

    ancestors1 = _get_ancestors_with_depth(members, member1_id)
    ancestors2 = _get_ancestors_with_depth(members, member2_id)

    if member2_id in ancestors1:
        depth = ancestors1[member2_id]
        return _ancestor_label(members[member2_id], depth), _build_ancestor_path(members, member1_id, member2_id)

    if member1_id in ancestors2:
        depth = ancestors2[member1_id]
        return _descendant_label(members[member1_id], depth), _build_ancestor_path(members, member2_id, member1_id)[::-1]

    common = set(ancestors1.keys()) & set(ancestors2.keys())
    if common:
        best = min(common, key=lambda c: ancestors1[c] + ancestors2[c])
        d1 = ancestors1[best]
        d2 = ancestors2[best]
        label = _cousin_label(d1, d2, members[member1_id], members[member2_id])
        path = _build_through_path(members, member1_id, member2_id, best)
        return label, path

    if members[member1_id].spouse_id == member2_id or members[member2_id].spouse_id == member1_id:
        return "Spouse", ["Spouse"]

    return "Not directly related", []


def _get_ancestors_with_depth(members: dict[int, FamilyMember], member_id: int) -> dict[int, int]:
    ancestors: dict[int, int] = {}
    queue: deque[tuple[int, int]] = deque([(member_id, 0)])
    visited: set[int] = set()

    while queue:
        current_id, depth = queue.popleft()
        if current_id in visited:
            continue
        visited.add(current_id)
        if depth > 0:
            ancestors[current_id] = depth

        member = members.get(current_id)
        if member:
            if member.father_id and member.father_id in members:
                queue.append((member.father_id, depth + 1))
            if member.mother_id and member.mother_id in members:
                queue.append((member.mother_id, depth + 1))

    return ancestors


def _ancestor_label(ancestor: FamilyMember, depth: int) -> str:
    if depth == 1:
        return "Father" if ancestor.gender == "male" else "Mother"
    if depth == 2:
        return "Grandfather" if ancestor.gender == "male" else "Grandmother"
    prefix = "Great-" * (depth - 2)
    return f"{prefix}Grandfather" if ancestor.gender == "male" else f"{prefix}Grandmother"


def _descendant_label(descendant: FamilyMember, depth: int) -> str:
    if depth == 1:
        return "Son" if descendant.gender == "male" else "Daughter"
    if depth == 2:
        return "Grandson" if descendant.gender == "male" else "Granddaughter"
    prefix = "Great-" * (depth - 2)
    return f"{prefix}Grandson" if descendant.gender == "male" else f"{prefix}Granddaughter"


def _cousin_label(d1: int, d2: int, m1: FamilyMember, m2: FamilyMember) -> str:
    if d1 == 1 and d2 == 1:
        return "Brother" if m2.gender == "male" else "Sister"
    if d1 == 1 and d2 == 2:
        return "Nephew" if m2.gender == "male" else "Niece"
    if d1 == 2 and d2 == 1:
        return "Uncle" if m2.gender == "male" else "Aunt"
    if d1 == 1 and d2 > 2:
        prefix = "Grand-" if d2 == 3 else "Great-" * (d2 - 3) + "Grand-"
        return f"{prefix}Nephew" if m2.gender == "male" else f"{prefix}Niece"
    if d2 == 1 and d1 > 2:
        prefix = "Grand-" if d1 == 3 else "Great-" * (d1 - 3) + "Grand-"
        return f"{prefix}Uncle" if m2.gender == "male" else f"{prefix}Aunt"

    cousin_degree = min(d1, d2) - 1
    removal = abs(d1 - d2)
    ordinal = _ordinal(cousin_degree)
    if removal == 0:
        return f"{ordinal} Cousin"
    return f"{ordinal} Cousin {removal}x Removed"


def _ordinal(n: int) -> str:
    if n == 1:
        return "1st"
    if n == 2:
        return "2nd"
    if n == 3:
        return "3rd"
    return f"{n}th"


def _build_ancestor_path(members: dict[int, FamilyMember], from_id: int, to_id: int) -> list[str]:
    path: list[str] = []
    current = from_id
    visited: set[int] = set()
    while current != to_id and current in members:
        if current in visited:
            break
        visited.add(current)
        m = members[current]
        path.append(f"{m.first_name} {m.last_name}")
        if m.father_id == to_id or m.mother_id == to_id:
            path.append(f"{members[to_id].first_name} {members[to_id].last_name}")
            break
        if m.father_id and m.father_id in members:
            current = m.father_id
        elif m.mother_id and m.mother_id in members:
            current = m.mother_id
        else:
            break
    return path


def _build_through_path(
    members: dict[int, FamilyMember], from_id: int, to_id: int, common_id: int
) -> list[str]:
    path_up = _build_ancestor_path(members, from_id, common_id)
    path_down = _build_ancestor_path(members, to_id, common_id)
    path_down.reverse()
    if path_up and path_down and path_up[-1] == path_down[0]:
        return path_up + path_down[1:]
    return path_up + path_down
