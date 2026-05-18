from datetime import datetime
from enum import Enum as PyEnum

from sqlalchemy import Column, DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from .database import Base


class Gender(str, PyEnum):
    MALE = "male"
    FEMALE = "female"
    OTHER = "other"


class Family(Base):
    __tablename__ = "families"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    family_code = Column(String(100), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    users = relationship("User", back_populates="family")
    members = relationship("FamilyMember", back_populates="family")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    email = Column(String(200), unique=True, nullable=False)
    hashed_password = Column(String(200), nullable=False)
    display_name = Column(String(200), nullable=False)
    family_id = Column(Integer, ForeignKey("families.id"), nullable=False)
    linked_member_id = Column(Integer, ForeignKey("family_members.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    family = relationship("Family", back_populates="users")
    linked_member = relationship("FamilyMember", foreign_keys=[linked_member_id])


class FamilyMember(Base):
    __tablename__ = "family_members"

    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    maiden_name = Column(String(100), nullable=True)
    gender = Column(Enum(Gender), nullable=False)
    birth_date = Column(String(20), nullable=True)
    death_date = Column(String(20), nullable=True)
    birth_place = Column(String(200), nullable=True)
    bio = Column(Text, nullable=True)
    photo_url = Column(String(500), nullable=True)
    family_id = Column(Integer, ForeignKey("families.id"), nullable=False)
    father_id = Column(Integer, ForeignKey("family_members.id"), nullable=True)
    mother_id = Column(Integer, ForeignKey("family_members.id"), nullable=True)
    spouse_id = Column(Integer, ForeignKey("family_members.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    family = relationship("Family", back_populates="members")
    father = relationship("FamilyMember", foreign_keys=[father_id], remote_side="FamilyMember.id")
    mother = relationship("FamilyMember", foreign_keys=[mother_id], remote_side="FamilyMember.id")
    spouse = relationship("FamilyMember", foreign_keys=[spouse_id], remote_side="FamilyMember.id")
