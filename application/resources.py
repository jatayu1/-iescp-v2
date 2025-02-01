from flask import request
from flask_restful import Resource, Api, reqparse, marshal, fields
from .models import db, User, Role, Influencer, Sponsor, Campaign, AdRequest
from .cache import cache
from flask_security import auth_required, roles_required, current_user
from sqlalchemy import or_
from werkzeug.security import generate_password_hash
from application.sec import datastore
from datetime import datetime, date, timedelta
from calendar import month_name
from sqlalchemy.exc import IntegrityError
from application.task import exportjob
import csv
from flask import make_response
import io

api = Api(prefix='/api')

# User Api
class users(Resource):
    def __init__(self):
        # Initialize the request parser within the class
        self.parser = reqparse.RequestParser()
        self.parser.add_argument('fullname', type=str, help='Full name of the user', required=True)
        self.parser.add_argument('username', type=str, help='Username of the user', required=True)
        self.parser.add_argument('email', type=str, help='Email of the user', required=True)
        self.parser.add_argument('password', type=str, help='Password of the user', required=True)
        self.parser.add_argument('role', type=str, help='User type, either "influencer" or "sponsor"', required=True)

    @auth_required("token")
    def get(self, user_id=None):
        # If user_id is provided, fetch the influencer details for that user
        if user_id:
            user = User.query.filter_by(id=user_id).first()
            if user:
                user_info = {
                    "id": user.id,
                    "fullname": user.fullname,
                    "username": user.username,
                    "email": user.email,
                    "flagged": user.flagged,
                    # "roles": user.roles,
                    # "registration_date": user.registration_date,
                }
                return user_info, 200
            else:
                return {"message": "User not found."}, 404

        # If user_id is not provided, return all influencer details
        all_users = User.query.all()
        if all_users:
            users_list = []
            for user in all_users:
                user_info = {
                    "id": user.id,
                    "fullname": user.fullname,
                    "username": user.username,
                    "email": user.email,
                    "flagged": user.flagged,
                    # "roles": user.roles,
                    # "registration_date": user.registration_date,
                }
                users_list.append(user_info)
            return users_list, 200
        else:
            return {"message": "User not found."}, 404

    def post(self):
        # Parse the arguments for user registration
        args = self.parser.parse_args()

        # Validate user type
        if args['role'] not in ['influencer', 'sponsor']:
            return {"message": "Invalid user type. Choose either 'influencer' or 'sponsor'."}, 400

        # Check if the email or username already exists
        existing_user = User.query.filter(
            (User.email == args['email']) | (User.username == args['username'])
        ).first()
        if existing_user:
            return {"message": "Email or Username already taken."}, 400

        # Create the user using Flask-Security's datastore
        try:
            new_user = datastore.create_user(
                fullname=args['fullname'],
                username=args['username'],
                email=args['email'],
                password=generate_password_hash(args['password']),
                roles=[args['role']],
                active = 0,
                registration_date=db.func.current_date()
            )
            db.session.commit()

            # Create role-specific entry in the influencer or sponsor table
            if args['role'] == 'influencer':
                influencer = Influencer(
                    user_id=new_user.id,
                    category=None,  # Set default values or handle via another request if needed
                    niche=None,
                    reach=None,
                    instagram_link=None,
                    instagram_followers=None,
                    facebook_link=None,
                    facebook_followers=None,
                    youtube_link=None,
                    youtube_followers=None,
                    X_link=None,
                    X_followers=None,
                    linkedin_link=None,
                    linkedin_followers=None
                )
                db.session.add(influencer)

            elif args['role'] == 'sponsor':
                sponsor = Sponsor(
                    user_id=new_user.id,
                    industry=None  # Set default value or handle via another request if needed
                )
                db.session.add(sponsor)

            db.session.commit()
            return {"message": f"User {args['username']} created successfully."}, 201

        except Exception as e:
            db.session.rollback()
            print(f"Exception: {str(e)}")
            return {"message": "Error while creating user. Check console logs for details."}, 500

api.add_resource(users, "/users", "/users/<int:user_id>")

# Current user info
class CurrentUser(Resource):
    @auth_required("token")
    def get(self):
        return {
            "id": current_user.id,
            "fullname": current_user.fullname,
            "username": current_user.username,
            "email": current_user.email,
            "role": current_user.roles[0].name if current_user.roles else "none"
        }, 200
    
    @auth_required("token")
    @cache.cached(timeout=120)
    def put(self):      
        # Define parsers as instance variables
        update_profile_parser = reqparse.RequestParser()

        # Initialize parsers
        update_profile_parser.add_argument("fullname", type=str, help="Fullname must be a string.")
        update_profile_parser.add_argument("email", type=str, help="Invalid email format.")
        update_profile_parser.add_argument("password", type=str, help="Password must be a string.")

        # sponsor details
        update_profile_parser.add_argument("industry", type=str, help="industry must be a string.")

        # influencer details
        update_profile_parser.add_argument("category", type=str, help="category must be a string.")
        update_profile_parser.add_argument("niche", type=str, help="niche must be a string.")

        update_profile_parser.add_argument("instagram_link", type=str, help="instagram_link must be a string.")
        update_profile_parser.add_argument("instagram_followers", type=str, help="instagram_followers must be a number.")

        update_profile_parser.add_argument("facebook_link", type=str, help="facebook_link must be a string.")
        update_profile_parser.add_argument("facebook_followers", type=str, help="facebook_followers must be a number.")

        update_profile_parser.add_argument("youtube_link", type=str, help="youtube_link must be a string.")
        update_profile_parser.add_argument("youtube_followers", type=str, help="youtube_followers must be a number.")

        update_profile_parser.add_argument("x_link", type=str, help="x_link must be a string.")
        update_profile_parser.add_argument("x_followers", type=str, help="x_followers must be a number.")

        update_profile_parser.add_argument("linkedin_link", type=str, help="linkedin_link must be a string.")
        update_profile_parser.add_argument("linkedin_followers", type=str, help="linkedin_followers must be a number.")

        args = update_profile_parser.parse_args()

        # Update only if the argument is not None
        if args["fullname"] is not None:
            current_user.fullname = args["fullname"]
        if args["email"] is not None:
            current_user.email = args["email"]
        if args["password"] is not None:
            current_user.password = generate_password_hash(args["password"])

        if args["industry"] is not None:
            current_user.sponsor.industry = args["industry"]

        if args["category"] is not None:
            current_user.influencer.category = args["category"]
        if args["niche"] is not None:
            current_user.influencer.niche = args["niche"]

        if args["instagram_link"] is not None:
            current_user.influencer.instagram_link = args["instagram_link"]
        if args["instagram_followers"] is not None:
            current_user.influencer.instagram_followers = args["instagram_followers"]

        if args["facebook_link"] is not None:
            current_user.influencer.facebook_link = args["facebook_link"]
        if args["facebook_followers"] is not None:
            current_user.influencer.facebook_followers = args["facebook_followers"]

        if args["youtube_link"] is not None:
            current_user.influencer.youtube_link = args["youtube_link"]
        if args["youtube_followers"] is not None:
            current_user.influencer.youtube_followers = args["youtube_followers"]

        if args["x_link"] is not None:
            current_user.influencer.X_link = args["x_link"]
        if args["x_followers"] is not None:
            current_user.influencer.X_followers = args["x_followers"]

        if args["linkedin_link"] is not None:
            current_user.influencer.linkedin_link = args["linkedin_link"]
        if args["linkedin_followers"] is not None:
            current_user.influencer.linkedin_followers = args["linkedin_followers"]

        try:
            # Save changes to the database
            db.session.commit()
            return {"message": "User details updated successfully."}, 200
        except IntegrityError as e:
            db.session.rollback()
            return {"error": "Email already exists."}, 409
        except Exception as e:
            db.session.rollback()
            return {"error": str(e)}, 500
        
    @auth_required("token")
    def delete(self):
        try:
            # Identify the current user's role
            role = current_user.roles[0].name if current_user.roles else "none"

            if role == "sponsor":
                # Delete sponsor-specific data
                if current_user.sponsor:
                    db.session.delete(current_user.sponsor)

                # Delete campaigns created by the sponsor
                for campaign in current_user.created_campaigns:
                    db.session.delete(campaign)

            elif role == "influencer":
                if current_user.influencer:
                    db.session.delete(current_user.influencer)

                # Delete campaigns created by the sponsor
                for campaign in current_user.assigned_campaigns:
                    campaign.status = 0

                # Delete ad requests sent by the influencer
                for sent_request in current_user.sent_ad_requests:
                    db.session.delete(sent_request)

            else:
                return {"message": "User can't be deleted due to invalid role."}, 400

            # Delete ad requests received by the user
            for received_request in current_user.received_ad_requests:
                db.session.delete(received_request)

            # Finally, delete the user
            db.session.delete(current_user)
            db.session.commit()

            return {"message": "User and associated data deleted successfully."}, 200

        except Exception as e:
            db.session.rollback()  # Rollback the transaction in case of errors
            print(f"Error deleting user: {e}")
            return {"message": "An error occurred while deleting the user."}, 500

api.add_resource(CurrentUser, "/current-user")

# user stat
class UserStat(Resource):
    @auth_required("token")
    def get(self):
        role = current_user.roles[0].name if current_user.roles else "none"
        if role == "influencer":
            output = {
                'total_earning': 0,
                'campaigns_completed': 0,
                'campaign_performance_last_month': {f"week {i}": 0 for i in range(1, 5)},  # Default weeks
                'campaign_performance_last_3_month': {},  # To be filled dynamically
                'campaign_performance_last_6_month': {},  # To be filled dynamically
                'campaign_performance_last_12_month': {month_name[m]: 0 for m in range(1, 13)},  # Default months
                'campaign_status_distribution': {
                    'completed': 0,
                    'inprogress': 0,
                },
                'top_performing_campaigns': {}
            }

            today = date.today()

            # Calculate time ranges
            first_day_this_month = today.replace(day=1)
            last_day_last_month = first_day_this_month - timedelta(days=1)
            first_day_last_month = last_day_last_month.replace(day=1)
            first_day_3_months_ago = (first_day_this_month - timedelta(days=90)).replace(day=1)
            first_day_6_months_ago = (first_day_this_month - timedelta(days=180)).replace(day=1)
            first_day_12_months_ago = (first_day_this_month - timedelta(days=365)).replace(day=1)

            # Initialize dynamic month keys for 3 and 6 months
            output['campaign_performance_last_3_month'] = {
                month_name[m]: 0 for m in range(first_day_3_months_ago.month, first_day_this_month.month)
            }
            output['campaign_performance_last_6_month'] = {
                month_name[m]: 0 for m in range(first_day_6_months_ago.month, first_day_this_month.month)
            }

            # Create a list of campaigns assigned to the user and their budgets
            assigned_campaigns = [
                campaign for campaign in current_user.assigned_campaigns if campaign.status == 1 or campaign.status == 2
            ]

            # Sort campaigns by budget in descending order and take the top 10
            sorted_campaigns = sorted(assigned_campaigns, key=lambda x: x.budget, reverse=True)[:10]

            # Populate the 'top_performing_campaigns' field
            output['top_performing_campaigns'] = {
                campaign.name: campaign.budget for campaign in sorted_campaigns
            }

            # Iterate through campaigns for other statistics
            for campaign in current_user.assigned_campaigns:
                # Update status counts and total earnings
                if campaign.status == 1:
                    output['campaign_status_distribution']['inprogress'] += 1
                elif campaign.status == 2:
                    output['total_earning'] += campaign.budget
                    output['campaign_status_distribution']['completed'] += 1
                    output['campaigns_completed'] += 1

                    # Filter campaigns by end_date and update appropriate buckets
                    if first_day_last_month <= campaign.end_date <= last_day_last_month:
                        week_number = (campaign.end_date.day - 1) // 7 + 1
                        week_key = f"week {week_number}"
                        output['campaign_performance_last_month'][week_key] += campaign.budget

                    if first_day_3_months_ago <= campaign.end_date < first_day_this_month:
                        month_name_key = month_name[campaign.end_date.month]
                        output['campaign_performance_last_3_month'][month_name_key] += campaign.budget

                    if first_day_6_months_ago <= campaign.end_date < first_day_this_month:
                        month_name_key = month_name[campaign.end_date.month]
                        output['campaign_performance_last_6_month'][month_name_key] += campaign.budget

                    if first_day_12_months_ago <= campaign.end_date < first_day_this_month:
                        month_name_key = month_name[campaign.end_date.month]
                        output['campaign_performance_last_12_month'][month_name_key] += campaign.budget

            return output, 200
        elif role == "sponsor":
            output = {
                'total_earning': 0,
                'campaigns_completed': 0,
                'campaign_performance_last_month': {f"week {i}": 0 for i in range(1, 5)},  # Default weeks
                'campaign_performance_last_3_month': {},  # To be filled dynamically
                'campaign_performance_last_6_month': {},  # To be filled dynamically
                'campaign_performance_last_12_month': {month_name[m]: 0 for m in range(1, 13)},  # Default months
                'campaign_status_distribution': {
                    'completed': 0,
                    'inprogress': 0,
                    'draft' : 0
                },
                'top_performing_campaigns': {}
            }

            today = date.today()

            # Calculate time ranges
            first_day_this_month = today.replace(day=1)
            last_day_last_month = first_day_this_month - timedelta(days=1)
            first_day_last_month = last_day_last_month.replace(day=1)
            first_day_3_months_ago = (first_day_this_month - timedelta(days=90)).replace(day=1)
            first_day_6_months_ago = (first_day_this_month - timedelta(days=180)).replace(day=1)
            first_day_12_months_ago = (first_day_this_month - timedelta(days=365)).replace(day=1)

            # Initialize dynamic month keys for 3 and 6 months
            output['campaign_performance_last_3_month'] = {
                month_name[m]: 0 for m in range(first_day_3_months_ago.month, first_day_this_month.month)
            }
            output['campaign_performance_last_6_month'] = {
                month_name[m]: 0 for m in range(first_day_6_months_ago.month, first_day_this_month.month)
            }

            # Create a list of campaigns assigned to the user and their budgets
            assigned_campaigns = [
                campaign for campaign in current_user.created_campaigns if campaign.status == 1 or campaign.status == 2
            ]

            # Sort campaigns by budget in descending order and take the top 10
            sorted_campaigns = sorted(assigned_campaigns, key=lambda x: x.budget, reverse=True)[:10]

            # Populate the 'top_performing_campaigns' field
            output['top_performing_campaigns'] = {
                campaign.name: campaign.budget for campaign in sorted_campaigns
            }

            # Iterate through campaigns for other statistics
            for campaign in current_user.created_campaigns:
                # Update status counts and total earnings
                if campaign.status == 0:
                    output['campaign_status_distribution']['draft'] += 1
                elif campaign.status == 1:
                    output['campaign_status_distribution']['inprogress'] += 1
                elif campaign.status == 2:
                    output['total_earning'] += campaign.budget
                    output['campaign_status_distribution']['completed'] += 1
                    output['campaigns_completed'] += 1

                    # Filter campaigns by end_date and update appropriate buckets
                    if first_day_last_month <= campaign.end_date <= last_day_last_month:
                        week_number = (campaign.end_date.day - 1) // 7 + 1
                        week_key = f"week {week_number}"
                        output['campaign_performance_last_month'][week_key] += campaign.budget

                    if first_day_3_months_ago <= campaign.end_date < first_day_this_month:
                        month_name_key = month_name[campaign.end_date.month]
                        output['campaign_performance_last_3_month'][month_name_key] += campaign.budget

                    if first_day_6_months_ago <= campaign.end_date < first_day_this_month:
                        month_name_key = month_name[campaign.end_date.month]
                        output['campaign_performance_last_6_month'][month_name_key] += campaign.budget

                    if first_day_12_months_ago <= campaign.end_date < first_day_this_month:
                        month_name_key = month_name[campaign.end_date.month]
                        output['campaign_performance_last_12_month'][month_name_key] += campaign.budget

            return output, 200
        else:
            output = {
                'total_users': 0,
                'total_campaigns': 0,
                'total_transaction': 0,
                'pending_approvals': 0,
                'transactions_last_month': {f"week {i}": 0 for i in range(1, 5)},  # Default weeks
                'transactions_last_3_month': {},  # To be filled dynamically
                'transactions_last_6_month': {},  # To be filled dynamically
                'transactions_last_12_month': {month_name[m]: 0 for m in range(1, 13)},  # Default months

                'user_reg_last_month': {f"week {i}": 0 for i in range(1, 5)},  # Default weeks
                'user_reg_last_3_month': {},  # To be filled dynamically
                'user_reg_last_6_month': {},  # To be filled dynamically
                'user_reg_last_12_month': {month_name[m]: 0 for m in range(1, 13)},  # Default months

                'inactive_users_list' : []
            }
            all_users = User.query.all()
            all_camp = Campaign.query.all()

            output['total_users'] = len(all_users)
            output['total_campaigns'] = len(all_camp)
            # Calculate pending approvals (users with active == False)
            output['pending_approvals'] = User.query.filter_by(active=False).count()

            # Calculate total_transaction (sum of budgets for campaigns with status == 2)
            output['total_transaction'] = db.session.query(
                db.func.sum(Campaign.budget)
            ).filter(Campaign.status == 2).scalar() or 0  # Use `or 0` to handle None

            today = date.today()
            # Calculate time ranges
            first_day_this_month = today.replace(day=1)
            last_day_last_month = first_day_this_month - timedelta(days=1)
            first_day_last_month = last_day_last_month.replace(day=1)
            first_day_3_months_ago = (first_day_this_month - timedelta(days=90)).replace(day=1)
            first_day_6_months_ago = (first_day_this_month - timedelta(days=180)).replace(day=1)
            first_day_12_months_ago = (first_day_this_month - timedelta(days=365)).replace(day=1)

            # Initialize dynamic month keys for 3 and 6 months
            output['transactions_last_3_month'] = {
                month_name[m]: 0 for m in range(first_day_3_months_ago.month, first_day_this_month.month)
            }
            output['transactions_last_6_month'] = {
                month_name[m]: 0 for m in range(first_day_6_months_ago.month, first_day_this_month.month)
            }

            # Initialize dynamic month keys for 3 and 6 months
            output['user_reg_last_3_month'] = {
                month_name[m]: 0 for m in range(first_day_3_months_ago.month, first_day_this_month.month)
            }
            output['user_reg_last_6_month'] = {
                month_name[m]: 0 for m in range(first_day_6_months_ago.month, first_day_this_month.month)
            }

            for campaign in all_camp:
                if campaign.status == 2:
                    # Filter campaigns by end_date and update appropriate buckets
                    if first_day_last_month <= campaign.end_date <= last_day_last_month:
                        week_number = (campaign.end_date.day - 1) // 7 + 1
                        week_key = f"week {week_number}"
                        output['transactions_last_month'][week_key] += campaign.budget

                    if first_day_3_months_ago <= campaign.end_date < first_day_this_month:
                        month_name_key = month_name[campaign.end_date.month]
                        output['transactions_last_3_month'][month_name_key] += campaign.budget

                    if first_day_6_months_ago <= campaign.end_date < first_day_this_month:
                        month_name_key = month_name[campaign.end_date.month]
                        output['transactions_last_6_month'][month_name_key] += campaign.budget

                    if first_day_12_months_ago <= campaign.end_date <= today:
                        month_name_key = month_name[campaign.end_date.month]
                        output['transactions_last_12_month'][month_name_key] += campaign.budget

            for user in all_users:
                # Filter campaigns by end_date and update appropriate buckets
                if first_day_last_month <= user.registration_date <= last_day_last_month:
                    week_number = (user.registration_date.day - 1) // 7 + 1
                    week_key = f"week {week_number}"
                    output['user_reg_last_month'][week_key] += 1

                if first_day_3_months_ago <= user.registration_date < first_day_this_month:
                    month_name_key = month_name[user.registration_date.month]
                    output['user_reg_last_3_month'][month_name_key] += 1

                if first_day_6_months_ago <= user.registration_date < first_day_this_month:
                    month_name_key = month_name[user.registration_date.month]
                    output['user_reg_last_6_month'][month_name_key] += 1

                if first_day_12_months_ago <= user.registration_date <= today:
                    month_name_key = month_name[user.registration_date.month]
                    output['user_reg_last_12_month'][month_name_key] += 1

            if all_users:
                users_list = []
                for user in all_users:
                    if user.active == 0:
                        user_info = {
                            "id": user.id,
                            "fullname": user.fullname,
                            "username": user.username,
                            "email": user.email,
                            "role": user.roles[0].name,
                        }
                        users_list.append(user_info)

            output['inactive_users_list'] = users_list
            return output

# Add the resource
api.add_resource(UserStat, "/user-stats")

class approveUser(Resource):
    def __init__(self):
        # Define parsers as instance variables
        self.approve_parser = reqparse.RequestParser()
        self.approve_parser.add_argument("uid", type=str, required=True, help="User ID name is required")

    @auth_required("token")
    @roles_required("admin")
    def put(self):
        args = self.approve_parser.parse_args()
        user = User.query.filter_by(
                id=args.uid,
            ).first()

        if not user:
            return {"message": "user not found"}, 404

        user.active = 1
        db.session.commit()
        return {"message": "User activated successfully."}, 200

    @auth_required("token")
    @roles_required("admin")
    def delete(self):
        args = self.approve_parser.parse_args()
        user = User.query.filter_by(
                id=args.uid,
            ).first()

        if not user:
            return {"message": "user not found"}, 404

        db.session.delete(user)
        db.session.commit()
        return {"message": "User deleted successfully."}, 200

# Add the resource
api.add_resource(approveUser, "/approve-user")

class flagUser(Resource):
    def __init__(self):
        # Define parsers as instance variables
        self.flag_parser = reqparse.RequestParser()
        self.flag_parser.add_argument("uid", type=str, required=True, help="User ID name is required")

    @auth_required("token")
    @roles_required("admin")
    def put(self):
        args = self.flag_parser.parse_args()
        user = User.query.filter_by(
                id=args.uid,
            ).first()

        if not user:
            return {"message": "user not found"}, 404

        user.flagged = 1
        db.session.commit()
        return {"message": "User activated successfully."}, 200
# Add the resource
api.add_resource(flagUser, "/flag-user")

class unFlagUser(Resource):
    def __init__(self):
        # Define parsers as instance variables
        self.flag_parser = reqparse.RequestParser()
        self.flag_parser.add_argument("uid", type=str, required=True, help="User ID name is required")

    @auth_required("token")
    @roles_required("admin")
    def put(self):
        args = self.flag_parser.parse_args()
        user = User.query.filter_by(
                id=args.uid,
            ).first()

        if not user:
            return {"message": "user not found"}, 404

        user.flagged = 0
        db.session.commit()
        return {"message": "User activated successfully."}, 200
# Add the resource
api.add_resource(unFlagUser, "/unflag-user")

class deleteUser(Resource):
    def __init__(self):
        # Define parsers as instance variables
        self.flag_parser = reqparse.RequestParser()
        self.flag_parser.add_argument("uid", type=str, required=True, help="User ID name is required")

    @auth_required("token")
    @roles_required("admin")
    def delete(self):
        args = self.flag_parser.parse_args()
        user = User.query.filter_by(
                id=args.uid,
            ).first()

        if not user:
            return {"message": "user not found"}, 404

        try:
            # Identify the current user's role
            role = user.roles[0].name if user.roles else "none"

            if role == "sponsor":
                # Delete sponsor-specific data
                if user.sponsor:
                    db.session.delete(user.sponsor)

                # Delete campaigns created by the sponsor
                for campaign in user.created_campaigns:
                    db.session.delete(campaign)

            elif role == "influencer":
                if user.influencer:
                    db.session.delete(user.influencer)

                # Delete campaigns created by the sponsor
                for campaign in user.assigned_campaigns:
                    campaign.status = 0

                # Delete ad requests sent by the influencer
                for sent_request in user.sent_ad_requests:
                    db.session.delete(sent_request)

            else:
                return {"message": "User can't be deleted due to invalid role."}, 400

            # Delete ad requests received by the user
            for received_request in user.received_ad_requests:
                db.session.delete(received_request)

            # Finally, delete the user
            db.session.delete(user)
            db.session.commit()

            return {"message": "User and associated data deleted successfully."}, 200

        except Exception as e:
            db.session.rollback()  # Rollback the transaction in case of errors
            print(f"Error deleting user: {e}")
            return {"message": "An error occurred while deleting the user."}, 500
# Add the resource
api.add_resource(deleteUser, "/delete-user")

class flagCampaign(Resource):
    def __init__(self):
        # Define parsers as instance variables
        self.flag_parser = reqparse.RequestParser()
        self.flag_parser.add_argument("cid", type=str, required=True, help="Campaign ID name is required")

    @auth_required("token")
    @roles_required("admin")
    def put(self):
        args = self.flag_parser.parse_args()
        camp = Campaign.query.filter_by(
                id=args.cid,
            ).first()

        if not camp:
            return {"message": "user not found"}, 404

        camp.flagged = 1
        db.session.commit()
        return {"message": "User activated successfully."}, 200
# Add the resource
api.add_resource(flagCampaign, "/flag-campaign")

class unFlagCampaign(Resource):
    def __init__(self):
        # Define parsers as instance variables
        self.flag_parser = reqparse.RequestParser()
        self.flag_parser.add_argument("cid", type=str, required=True, help="Campaign ID name is required")

    @auth_required("token")
    @roles_required("admin")
    def put(self):
        args = self.flag_parser.parse_args()
        camp = Campaign.query.filter_by(
                id=args.cid,
            ).first()

        if not camp:
            return {"message": "user not found"}, 404

        camp.flagged = 0
        db.session.commit()
        return {"message": "User activated successfully."}, 200
# Add the resource
api.add_resource(unFlagCampaign, "/unflag-campaign")

# Influencer API
class InfluencerDetails(Resource):
    @auth_required("token")
    def get(self, user_id=None):
        # If user_id is provided, fetch the influencer details for that user
        if user_id:
            influencer = Influencer.query.filter_by(user_id=user_id).first()
            if influencer:
                user = User.query.get(influencer.user_id)
                influencer_info = {
                    "id": influencer.id,
                    "user_id": influencer.user_id,
                    "fullname": user.fullname,
                    "username": user.username,
                    "email": user.email,
                    "category": influencer.category,
                    "niche": influencer.niche,
                    "flag": user.flagged,
                    "social_links": {
                        "instagram_link": influencer.instagram_link,
                        "instagram_followers": influencer.instagram_followers,
                        "facebook_link": influencer.facebook_link,
                        "facebook_followers": influencer.facebook_followers,
                        "youtube_link": influencer.youtube_link,
                        "youtube_followers": influencer.youtube_followers,
                        "x_link": influencer.X_link,
                        "x_followers": influencer.X_followers,
                        "linkedin_link": influencer.linkedin_link,
                        "linkedin_followers": influencer.linkedin_followers,
                    },
                }
                return influencer_info, 200
            else:
                return {"message": "Influencer not found."}, 404

        # If user_id is not provided, return all influencer details
        all_influencers = Influencer.query.all()
        influencers_list = []
        for influencer in all_influencers:
            user = User.query.get(influencer.user_id)
            influencer_info = {
                "id": influencer.id,
                "user_id": influencer.user_id,
                "fullname": user.fullname,
                "username": user.username,
                "email": user.email,
                "category": influencer.category,
                "niche": influencer.niche,
                "flag": user.flagged,
                "social_links": {
                    "instagram_link": influencer.instagram_link,
                    "instagram_followers": influencer.instagram_followers,
                    "facebook_link": influencer.facebook_link,
                    "facebook_followers": influencer.facebook_followers,
                    "youtube_link": influencer.youtube_link,
                    "youtube_followers": influencer.youtube_followers,
                    "x_link": influencer.X_link,
                    "x_followers": influencer.X_followers,
                    "linkedin_link": influencer.linkedin_link,
                    "linkedin_followers": influencer.linkedin_followers,
                },
            }
            influencers_list.append(influencer_info)
        return influencers_list, 200

api.add_resource(InfluencerDetails, "/influencer-details", "/influencer-details/<int:user_id>")

# Sponsor API
class SponsorDetails(Resource):
    @auth_required("token")
    def get(self, user_id=None):
        # If user_id is provided, fetch the influencer details for that user
        if user_id:
            sponsor = Sponsor.query.filter_by(user_id=user_id).first()
            if sponsor:
                user = User.query.get(sponsor.user_id)
                sponsor_info = {
                    "id": sponsor.id,
                    "user_id": sponsor.user_id,
                    "fullname": user.fullname,
                    "username": user.username,
                    "email": user.email,
                    "industry": sponsor.industry,
                    "flag": user.flagged,
                }
                return sponsor_info, 200
            else:
                return {"message": "Sponsor not found."}, 404

        # If user_id is not provided, return all influencer details
        all_sponsors = Sponsor.query.all()
        sponsors_list = []
        for sponsor in all_sponsors:
            user = User.query.get(sponsor.user_id)
            sponsor_info = {
                "id": sponsor.id,
                "user_id": sponsor.user_id,
                "fullname": user.fullname,
                "username": user.username,
                "email": user.email,
                "industry": sponsor.industry,
                "flag": user.flagged,
            }
            sponsors_list.append(sponsor_info)
        return sponsors_list, 200

api.add_resource(SponsorDetails, "/sponsor-details", "/sponsor-details/<int:user_id>")

# Campaign Api
class CampaignAPI(Resource):
    def __init__(self):
        # Define parsers as instance variables
        self.create_campaign_parser = reqparse.RequestParser()

        # Initialize parsers
        self.create_campaign_parser.add_argument("name", type=str, required=True, help="Campaign name is required")
        self.create_campaign_parser.add_argument("description", type=str, help="Description of the campaign")
        self.create_campaign_parser.add_argument("start_date", type=str, required=True, help="Start date is required (YYYY-MM-DD)")
        self.create_campaign_parser.add_argument("end_date", type=str, required=True, help="End date is required (YYYY-MM-DD)")
        self.create_campaign_parser.add_argument("budget", type=int, help="Budget for the campaign")
        self.create_campaign_parser.add_argument("visibility", type=bool, default=True, help="Visibility of the campaign")
        
        # Marshal fields for response
        self.campaign_fields = {
            "id": fields.Integer,
            "name": fields.String,
            "description": fields.String,
            "start_date": fields.String,
            "end_date": fields.String,
            "budget": fields.Integer,
            "visibility": fields.Boolean,
            "status": fields.Integer,
            "flagged": fields.Boolean,
            "created_by": fields.Integer,
            "assigned_to": fields.Integer,
        }

    @auth_required("token")
    def get(self, campaign_id=None):
        try:
            # Identify the user role
            user_role = None
            if current_user.has_role("admin"):
                user_role = "admin"
            elif hasattr(current_user, "influencer") and current_user.influencer:
                user_role = "influencer"
            elif hasattr(current_user, "sponsor") and current_user.sponsor:
                user_role = "sponsor"

            if not user_role:
                return {"message": "User role not recognized or insufficient permissions"}, 403

            # Check if a specific campaign_id is provided
            if campaign_id:
                campaign = Campaign.query.filter_by(id=campaign_id).first()
                if not campaign:
                    return {"message": "Campaign not found"}, 404

                if user_role == "influencer":
                    has_access = campaign.visibility or campaign.assigned_to == current_user.id
                    ad_requests = AdRequest.query.filter(
                        AdRequest.campaign_id == campaign.id,
                        db.or_(
                            AdRequest.sent_to == current_user.id,
                            AdRequest.sent_by == current_user.id
                        )
                    ).all()

                    if not (has_access or ad_requests):
                        return {"message": "Access denied to this campaign"}, 403

                if user_role == "sponsor" and campaign.created_by != current_user.id:
                    return {"message": "Access denied to this campaign"}, 403

                response = marshal(campaign, self.campaign_fields)
                return response, 200

            query = Campaign.query
            if user_role == "admin":
                pass
            elif user_role == "influencer":
                query = query.filter(
                    db.or_(
                        Campaign.visibility == True,
                        Campaign.assigned_to == current_user.id,
                        Campaign.id.in_(
                            db.session.query(AdRequest.campaign_id)
                            .filter(
                                db.or_(
                                    AdRequest.sent_to == current_user.id,
                                    AdRequest.sent_by == current_user.id
                                )
                            )
                            .subquery()
                        )
                    )
                )
            elif user_role == "sponsor":
                query = query.filter(
                    db.or_(
                        Campaign.visibility == True,
                        Campaign.created_by == current_user.id,
                    )
                )

            campaigns = query.all()
            response = marshal(campaigns, self.campaign_fields)
            return response, 200
        except Exception as e:
            print("Error:", str(e))
            return {"message": "An error occurred while fetching campaigns."}, 500

    @auth_required("token")
    @roles_required("sponsor")
    def post(self):
        args = self.create_campaign_parser.parse_args()
        try:
            start_date = datetime.strptime(args.start_date, "%Y-%m-%d").date()
            end_date = datetime.strptime(args.end_date, "%Y-%m-%d").date()
        except ValueError:
            return {"message": "Invalid date format. Use YYYY-MM-DD."}, 400

        if end_date < start_date:
            return {"message": "End date must be after start date."}, 400

        new_campaign = Campaign(
            name=args.name,
            description=args.description,
            start_date=start_date,
            end_date=end_date,
            budget=args.budget,
            visibility=bool(args.visibility),
            status=0,
            created_by=current_user.id,
        )

        db.session.add(new_campaign)
        db.session.commit()
        response = marshal(new_campaign, self.campaign_fields)
        return response, 201

    @auth_required("token")
    def delete(self, campaign_id):
        try:
            user_role = None
            if current_user.has_role("admin"):
                user_role = "admin"
            elif hasattr(current_user, "sponsor") and current_user.sponsor:
                user_role = "sponsor"

            if not user_role:
                return {"message": "User role not recognized or insufficient permissions"}, 403

            campaign = Campaign.query.get(campaign_id)
            if not campaign:
                return {"message": "Campaign not found."}, 404

            if user_role == "sponsor" and campaign.created_by != current_user.id:
                return {"message": "You do not have permission to delete this campaign."}, 403

            db.session.delete(campaign)
            db.session.commit()
            return {"message": "Campaign deleted successfully."}, 200
        except Exception as e:
            print(f"Error deleting campaign: {e}")
            return {"message": "An error occurred while deleting the campaign."}, 500

    @auth_required("token")
    def put(self, campaign_id):
        try:
            campaign = Campaign.query.get(campaign_id)
            if not campaign:
                return {"message": "Campaign not found"}, 404

            user_role = None
            if current_user.has_role("admin"):
                user_role = "admin"
            elif hasattr(current_user, "sponsor") and current_user.sponsor:
                user_role = "sponsor"

            if not user_role:
                return {"message": "User role not recognized or insufficient permissions"}, 403

            if user_role != "admin" and campaign.created_by != current_user.id:
                return {"message": "Access denied. You cannot update this campaign."}, 403

            parser = reqparse.RequestParser()
            parser.add_argument("name", type=str, help="Name is required.")
            parser.add_argument("description", type=str, help="Description is required.")
            parser.add_argument("start_date", type=str, help="Start date is required.")
            parser.add_argument("end_date", type=str, help="End date is required.")
            parser.add_argument("visibility", type=bool, help="Visibility is required.")
            parser.add_argument("status", type=str, help="Status is integer.")
            args = parser.parse_args()

            # Update only if the argument is not None
            if args["name"] is not None:
                campaign.name = args["name"]
            if args["description"] is not None:
                campaign.description = args["description"]
            if args["start_date"] is not None:
                try:
                    campaign.start_date = datetime.strptime(args["start_date"], "%Y-%m-%d").date()
                except ValueError:
                    return {"message": "Invalid start date format. Use 'YYYY-MM-DD'."}, 400
            if args["end_date"] is not None:
                try:
                    campaign.end_date = datetime.strptime(args["end_date"], "%Y-%m-%d").date()
                except ValueError:
                    return {"message": "Invalid end date format. Use 'YYYY-MM-DD'."}, 400
            if args["visibility"] is not None:
                campaign.visibility = args["visibility"]
            if args["status"] is not None:
                campaign.status = args["status"]

            db.session.commit()
            response = marshal(campaign, self.campaign_fields)
            return response, 200
        except Exception as e:
            print("Error:", str(e))
            return {"message": "An error occurred while updating the campaign."}, 500

api.add_resource(CampaignAPI, "/campaigns", "/campaigns/<int:campaign_id>")

# AdRequest API
class AdRequestAPI(Resource):
    def __init__(self):
        # Define fields for marshalling
        self.ad_request_fields = {
            "id": fields.Integer,
            "campaign_id": fields.Integer,
            "sent_to": fields.Integer,
            "sent_by": fields.Integer,
            "payment_amount": fields.Integer,
            "flagged": fields.Boolean,
        }

        # Create request parsers
        self.create_ad_request_parser = reqparse.RequestParser()
        self.create_ad_request_parser.add_argument("campaign_id", type=int, required=True, help="Campaign ID is required")
        self.create_ad_request_parser.add_argument("sent_to", type=int, required=True, help="Recipient ID is required")
        self.create_ad_request_parser.add_argument("sent_by", type=int, required=True, help="Sender ID is required")
        self.create_ad_request_parser.add_argument("payment_amount", type=int, help="Payment amount is optional")

        self.update_ad_request_parser = reqparse.RequestParser()
        self.update_ad_request_parser.add_argument("payment_amount", type=int, required=True, help="Payment amount is required")

        self.delete_ad_request_parser = reqparse.RequestParser()
        self.delete_ad_request_parser.add_argument("campaign_id", type=int, required=True, help="Campaign ID is required")
        self.delete_ad_request_parser.add_argument("sent_to", type=int, required=True, help="Recipient ID is required")
        self.delete_ad_request_parser.add_argument("sent_by", type=int, required=True, help="Sender ID is required")

    @auth_required("token")
    def get(self, ad_request_id=None):
        try:
            if ad_request_id:
                ad_request = AdRequest.query.get(ad_request_id)
                if not ad_request:
                    return {"message": "Ad request not found"}, 404
                response = marshal(ad_request, self.ad_request_fields)
                return response, 200

            ad_requests = AdRequest.query.all()
            response = marshal(ad_requests, self.ad_request_fields)
            return response, 200

        except Exception as e:
            print(f"Error fetching ad requests: {e}")
            return {"message": "An error occurred while fetching ad requests."}, 500

    @auth_required("token")
    def post(self):
        args = self.create_ad_request_parser.parse_args()

        try:
            # Check for existing ad request with the same campaign_id and users in either direction
            existing_ad_request = AdRequest.query.filter(
                (AdRequest.campaign_id == args.campaign_id) &
                ((AdRequest.sent_by == args.sent_by) & (AdRequest.sent_to == args.sent_to)) |
                ((AdRequest.sent_by == args.sent_to) & (AdRequest.sent_to == args.sent_by))
            ).first()

            if existing_ad_request:
                # If an existing request is found, delete it before creating the new one
                db.session.delete(existing_ad_request)
                db.session.commit()

            # Create and add the new ad request
            new_ad_request = AdRequest(
                campaign_id=args.campaign_id,
                sent_to=args.sent_to,
                sent_by=args.sent_by,
                payment_amount=args.payment_amount,
            )

            db.session.add(new_ad_request)
            db.session.commit()

            response = marshal(new_ad_request, self.ad_request_fields)
            return response, 201

        except IntegrityError as e:
            print(f"Integrity error: {e}")
            return {"message": "Failed to create ad request due to database constraint."}, 400
        except Exception as e:
            print(f"Error creating ad request: {e}")
            return {"message": "An error occurred while creating the ad request."}, 500

    @auth_required("token")
    def put(self, ad_request_id):
        args = self.update_ad_request_parser.parse_args()

        ad_request = AdRequest.query.get(ad_request_id)
        if not ad_request:
            return {"message": "Ad request not found"}, 404

        try:
            ad_request.payment_amount = args.payment_amount
            db.session.commit()

            response = marshal(ad_request, self.ad_request_fields)
            return response, 200

        except Exception as e:
            print(f"Error updating ad request: {e}")
            return {"message": "An error occurred while updating the ad request."}, 500

    @auth_required("token")
    def delete(self):
        try:
            args = self.delete_ad_request_parser.parse_args()
            # Find the ad request matching the campaign_id, sent_by, and sent_to
            ad_request = AdRequest.query.filter_by(
                campaign_id=args.campaign_id, 
                sent_by=args.sent_by, 
                sent_to=args.sent_to
            ).first()

            if not ad_request:
                return {"message": "Ad request not found"}, 404

            # Delete the found ad request
            db.session.delete(ad_request)
            db.session.commit()
            return {"message": "Ad request deleted successfully."}, 200

        except Exception as e:
            print(f"Error deleting ad request: {e}")
            return {"message": "An error occurred while deleting the ad request."}, 500

api.add_resource(AdRequestAPI, "/ad_requests", "/ad_requests/<int:ad_request_id>")

# AdRequest Accept API
class AdRequestAccept(Resource):
    def __init__(self):
        self.accept_ad_request_parser = reqparse.RequestParser()
        self.accept_ad_request_parser.add_argument("req_id", type=int, required=True, help="Ad request ID is required")
        self.accept_ad_request_parser.add_argument("uid", type=int, required=True, help="User ID is required")

    @auth_required("token")
    def post(self):
        args = self.accept_ad_request_parser.parse_args()
        try:       
            # Step 1: Fetch the ad request
            ad_request = AdRequest.query.get(args.req_id)
            if not ad_request:
                return {"message": "Ad request not found"}, 404
            
            # Step 2: Fetch the associated campaign
            campaign = Campaign.query.get(ad_request.campaign_id)
            if not campaign:
                return {"message": "Associated campaign not found"}, 404
            
            # Step 3: Update the campaign's status and assign to the current user
            campaign.status = 1  # Set to "Active"
            campaign.budget = ad_request.payment_amount
            campaign.assigned_to = args.uid

            # Step 4: Delete all ad requests for the associated campaign
            AdRequest.query.filter_by(campaign_id=ad_request.campaign_id).delete()
            
            # Step 5: Commit the changes
            db.session.commit()

            return {"message": "Ad request accepted, and campaign is now active."}, 200

        except Exception as e:
            print(f"Error accepting ad request: {e}")
            return {"message": "An error occurred while accepting the ad request."}, 500

api.add_resource(AdRequestAccept, "/accept")

# export campaign
class Export(Resource):
    @auth_required("token")
    @roles_required("sponsor")
    def get(self):
        username = current_user.username
        email = current_user.email

        # Generate CSV in memory
        output = io.StringIO()
        writer = csv.DictWriter(output, fieldnames=[
            'name', 'description', 'start_date', 'end_date', 
            'budget', 'visibility', 'status', 'flagged', 
            'created_by', 'assigned_to'
        ], restval='')
        writer.writeheader()

        for camp in current_user.created_campaigns:
            writer.writerow({
                'name': camp.name,
                'description': camp.description,
                'start_date': camp.start_date,
                'end_date': camp.end_date,
                'budget': camp.budget,
                'visibility': camp.visibility,
                'status': camp.status,
                'flagged': camp.flagged,
                'created_by': camp.created_by,
                'assigned_to': camp.assigned_to,
            })
        
        output.seek(0)
        csv_data = output.getvalue()

        # Trigger Celery task to send the email with attachment
        exportjob.delay(csv_data, email, username)

        # Send CSV as response for download
        response = make_response(csv_data)
        response.headers["Content-Disposition"] = "attachment; filename=export-camp.csv"
        response.headers["Content-Type"] = "text/csv"
        return response
    
api.add_resource(Export, '/export')