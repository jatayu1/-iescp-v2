from flask_sqlalchemy import SQLAlchemy
from flask_security import UserMixin, RoleMixin
from sqlalchemy import CheckConstraint,event

db = SQLAlchemy()

class RolesUsers(db.Model):
    __tablename__ = 'roles_users'
    id = db.Column(db.Integer(), primary_key=True)
    user_id = db.Column('user_id', db.Integer(), db.ForeignKey('user.id'))
    role_id = db.Column('role_id', db.Integer(), db.ForeignKey('role.id'))

class Role(db.Model, RoleMixin):
    id = db.Column(db.Integer(), primary_key=True)
    name = db.Column(db.String(80), unique=True)
    description = db.Column(db.String(255))

class User(db.Model, UserMixin):
    id = db.Column(db.Integer, autoincrement=True, primary_key=True)
    fullname = db.Column(db.String(length=30), nullable=True)
    username = db.Column(db.String, unique=True, nullable=False)
    email = db.Column(db.String, unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    active = db.Column(db.Boolean(), default=False)
    flagged = db.Column(db.Boolean(), default=False)
    fs_uniquifier = db.Column(db.String(255), unique=True, nullable=False)
    roles = db.relationship('Role', secondary='roles_users', backref=db.backref("users", lazy="dynamic"))
    registration_date = db.Column(db.Date, nullable=False)

    def has_role(self, role_name):
        return role_name in [role.name for role in self.roles]

# Influencer Model
class Influencer(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    category = db.Column(db.String(50), nullable=True)
    niche = db.Column(db.String(50), nullable=True)
    reach = db.Column(db.String(50), nullable=True)

    # Social Media Details
    instagram_link = db.Column(db.String(length=100), nullable=True)
    instagram_followers = db.Column(db.Integer, nullable=True)

    facebook_link = db.Column(db.String(length=100), nullable=True)
    facebook_followers = db.Column(db.Integer, nullable=True)

    youtube_link = db.Column(db.String(length=100), nullable=True)
    youtube_followers = db.Column(db.Integer, nullable=True)

    X_link = db.Column(db.String(length=100), nullable=True)
    X_followers = db.Column(db.Integer, nullable=True)

    linkedin_link = db.Column(db.String(length=100), nullable=True)
    linkedin_followers = db.Column(db.Integer, nullable=True)

    user = db.relationship('User', backref=db.backref('influencer', uselist=False))

# Sponsor Model
class Sponsor(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    industry = db.Column(db.String(50), nullable=True)
    user = db.relationship('User', backref=db.backref('sponsor', uselist=False))

# Campaign Model
class Campaign(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)
    description = db.Column(db.Text, nullable=True)
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False)
    budget = db.Column(db.Integer, nullable=True)
    visibility = db.Column(db.Boolean(), default=True)
    status = db.Column(db.Integer, nullable=False)  # 0: Draft, 1: Active, 2: Completed
    flagged = db.Column(db.Boolean(), default=False)
    created_by = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    assigned_to = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)

    creator = db.relationship('User', foreign_keys=[created_by], backref=db.backref('created_campaigns', lazy=True))
    assignee = db.relationship('User', foreign_keys=[assigned_to], backref=db.backref('assigned_campaigns', lazy=True))

    # Add cascade delete
    ad_requests = db.relationship('AdRequest', cascade='all, delete-orphan', backref='campaign')

    __table_args__ = (
        CheckConstraint('status IN (0, 1, 2)', name='check_status'),
    )

# Ad Request Model
class AdRequest(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    campaign_id = db.Column(db.Integer, db.ForeignKey('campaign.id'), nullable=False)
    sent_to = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    sent_by = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    payment_amount = db.Column(db.Integer, nullable=True)
    flagged = db.Column(db.Boolean(), default=False)

    # campaign = db.relationship('Campaign', backref=db.backref('ad_requests', lazy=True))
    sent_to_user = db.relationship('User', foreign_keys=[sent_to], backref=db.backref('received_ad_requests', lazy=True))
    sent_by_user = db.relationship('User', foreign_keys=[sent_by], backref=db.backref('sent_ad_requests', lazy=True))

    __table_args__ = (
        db.UniqueConstraint('campaign_id', 'sent_to', 'sent_by', name='unique_ad_request'),
    )