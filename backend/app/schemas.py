from datetime import datetime

from pydantic import BaseModel, EmailStr


class FamilyCreate(BaseModel):
    name: str
    family_code: str
    description: str | None = None


class FamilyResponse(BaseModel):
    id: int
    name: str
    family_code: str
    description: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class UserRegister(BaseModel):
    username: str
    email: str
    password: str
    display_name: str
    family_code: str


class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    display_name: str
    family_id: int


class UserLogin(BaseModel):
    username: str
    password: str


class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    display_name: str
    family_id: int
    linked_member_id: int | None
    created_at: datetime

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class MemberCreate(BaseModel):
    first_name: str
    last_name: str
    maiden_name: str | None = None
    gender: str
    birth_date: str | None = None
    death_date: str | None = None
    birth_place: str | None = None
    bio: str | None = None
    photo_url: str | None = None
    father_id: int | None = None
    mother_id: int | None = None
    spouse_id: int | None = None


class MemberUpdate(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    maiden_name: str | None = None
    gender: str | None = None
    birth_date: str | None = None
    death_date: str | None = None
    birth_place: str | None = None
    bio: str | None = None
    photo_url: str | None = None
    father_id: int | None = None
    mother_id: int | None = None
    spouse_id: int | None = None


class MemberResponse(BaseModel):
    id: int
    first_name: str
    last_name: str
    maiden_name: str | None
    gender: str
    birth_date: str | None
    death_date: str | None
    birth_place: str | None
    bio: str | None
    photo_url: str | None
    family_id: int
    father_id: int | None
    mother_id: int | None
    spouse_id: int | None
    created_at: datetime

    model_config = {"from_attributes": True}


class RelationshipResponse(BaseModel):
    member1: MemberResponse
    member2: MemberResponse
    relationship: str
    path: list[str]
