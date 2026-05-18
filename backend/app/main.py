from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from .auth import create_access_token, get_current_user, hash_password, verify_password
from .database import Base, engine, get_db
from .models import Family, FamilyMember, User
from .relationships import find_relationship
from .schemas import (
    FamilyCreate,
    FamilyResponse,
    MemberCreate,
    MemberResponse,
    MemberUpdate,
    RelationshipResponse,
    TokenResponse,
    UserLogin,
    UserRegister,
    UserResponse,
)

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Family Trees API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Auth ---


@app.post("/api/auth/register-family", response_model=TokenResponse)
def register_family(data: UserRegister, db: Session = Depends(get_db)):
    existing_family = db.query(Family).filter(Family.family_code == data.family_code).first()

    if existing_family:
        family = existing_family
    else:
        family = Family(name=data.family_code, family_code=data.family_code)
        db.add(family)
        db.flush()

    if db.query(User).filter(User.username == data.username).first():
        raise HTTPException(status_code=400, detail="Username already taken")
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        username=data.username,
        email=data.email,
        hashed_password=hash_password(data.password),
        display_name=data.display_name,
        family_id=family.id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": str(user.id)})
    return TokenResponse(access_token=token, user=UserResponse.model_validate(user))


@app.post("/api/auth/login", response_model=TokenResponse)
def login(data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == data.username).first()
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token({"sub": str(user.id)})
    return TokenResponse(access_token=token, user=UserResponse.model_validate(user))


@app.get("/api/auth/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)


# --- Family ---


@app.get("/api/family", response_model=FamilyResponse)
def get_family(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    family = db.query(Family).filter(Family.id == current_user.family_id).first()
    if not family:
        raise HTTPException(status_code=404, detail="Family not found")
    return FamilyResponse.model_validate(family)


@app.put("/api/family", response_model=FamilyResponse)
def update_family(
    data: FamilyCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    family = db.query(Family).filter(Family.id == current_user.family_id).first()
    if not family:
        raise HTTPException(status_code=404, detail="Family not found")
    family.name = data.name
    family.description = data.description
    db.commit()
    db.refresh(family)
    return FamilyResponse.model_validate(family)


# --- Members ---


@app.get("/api/members", response_model=list[MemberResponse])
def get_members(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    members = (
        db.query(FamilyMember)
        .filter(FamilyMember.family_id == current_user.family_id)
        .order_by(FamilyMember.last_name, FamilyMember.first_name)
        .all()
    )
    return [MemberResponse.model_validate(m) for m in members]


@app.post("/api/members", response_model=MemberResponse, status_code=201)
def create_member(
    data: MemberCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    member = FamilyMember(
        **data.model_dump(),
        family_id=current_user.family_id,
    )
    db.add(member)
    db.commit()
    db.refresh(member)

    if data.spouse_id:
        spouse = db.query(FamilyMember).filter(FamilyMember.id == data.spouse_id).first()
        if spouse and not spouse.spouse_id:
            spouse.spouse_id = member.id
            db.commit()

    return MemberResponse.model_validate(member)


@app.get("/api/members/{member_id}", response_model=MemberResponse)
def get_member(
    member_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    member = (
        db.query(FamilyMember)
        .filter(FamilyMember.id == member_id, FamilyMember.family_id == current_user.family_id)
        .first()
    )
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    return MemberResponse.model_validate(member)


@app.put("/api/members/{member_id}", response_model=MemberResponse)
def update_member(
    member_id: int,
    data: MemberUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    member = (
        db.query(FamilyMember)
        .filter(FamilyMember.id == member_id, FamilyMember.family_id == current_user.family_id)
        .first()
    )
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(member, key, value)

    db.commit()
    db.refresh(member)
    return MemberResponse.model_validate(member)


@app.delete("/api/members/{member_id}", status_code=204)
def delete_member(
    member_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    member = (
        db.query(FamilyMember)
        .filter(FamilyMember.id == member_id, FamilyMember.family_id == current_user.family_id)
        .first()
    )
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    db.query(FamilyMember).filter(FamilyMember.father_id == member_id).update({"father_id": None})
    db.query(FamilyMember).filter(FamilyMember.mother_id == member_id).update({"mother_id": None})
    db.query(FamilyMember).filter(FamilyMember.spouse_id == member_id).update({"spouse_id": None})

    db.delete(member)
    db.commit()


@app.get("/api/members/{member_id}/children", response_model=list[MemberResponse])
def get_children(
    member_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    children = (
        db.query(FamilyMember)
        .filter(
            FamilyMember.family_id == current_user.family_id,
            (FamilyMember.father_id == member_id) | (FamilyMember.mother_id == member_id),
        )
        .all()
    )
    return [MemberResponse.model_validate(c) for c in children]


# --- Relationships ---


@app.get("/api/relationships/{member1_id}/{member2_id}", response_model=RelationshipResponse)
def get_relationship(
    member1_id: int,
    member2_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    m1 = (
        db.query(FamilyMember)
        .filter(FamilyMember.id == member1_id, FamilyMember.family_id == current_user.family_id)
        .first()
    )
    m2 = (
        db.query(FamilyMember)
        .filter(FamilyMember.id == member2_id, FamilyMember.family_id == current_user.family_id)
        .first()
    )
    if not m1 or not m2:
        raise HTTPException(status_code=404, detail="Member not found")

    relationship, path = find_relationship(db, member1_id, member2_id, current_user.family_id)

    return RelationshipResponse(
        member1=MemberResponse.model_validate(m1),
        member2=MemberResponse.model_validate(m2),
        relationship=relationship,
        path=path,
    )


# --- Tree Data ---


@app.get("/api/tree")
def get_tree(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    members = (
        db.query(FamilyMember)
        .filter(FamilyMember.family_id == current_user.family_id)
        .all()
    )

    nodes = []
    for m in members:
        children = (
            db.query(FamilyMember)
            .filter(
                FamilyMember.family_id == current_user.family_id,
                (FamilyMember.father_id == m.id) | (FamilyMember.mother_id == m.id),
            )
            .all()
        )
        nodes.append(
            {
                "id": m.id,
                "first_name": m.first_name,
                "last_name": m.last_name,
                "gender": m.gender.value if m.gender else None,
                "birth_date": m.birth_date,
                "death_date": m.death_date,
                "photo_url": m.photo_url,
                "father_id": m.father_id,
                "mother_id": m.mother_id,
                "spouse_id": m.spouse_id,
                "children_ids": [c.id for c in children],
            }
        )

    return {"family_id": current_user.family_id, "nodes": nodes}


@app.get("/api/health")
def health_check():
    return {"status": "ok"}
