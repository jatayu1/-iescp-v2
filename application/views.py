from flask import current_app as app, jsonify, request, render_template
from flask_security import auth_required, roles_required
from .models import User, db
from .sec import datastore
from werkzeug.security import check_password_hash
from flask_restful import marshal, fields

@app.get('/')
def home():
    return render_template("index.html")

@app.get('/admin')
@auth_required("token")
@roles_required("admin")
def admin():
    return "welcome admin"

@app.post('/user-login')
def user_login():
    data = request.get_json()
    email = data.get('email')
    if not email:
        return jsonify({"message" : "email not found"}), 400

    user = datastore.find_user(email=email)

    if not user:
        return jsonify({"message" : "User Not Found"}), 404
    
    if check_password_hash(user.password, data.get("password")):
        return jsonify({ 
            "token" : user.get_auth_token(),
            "email" : user.email,
            "role" : user.roles[0].name
        })
    else:
        return jsonify({"message" : "wrong Password"}), 400
    

user_fields = {
    "id": fields.Integer,
    "email": fields.String,
    "active": fields.Boolean
}

@app.get('/users')
@auth_required("token")
@roles_required("admin")
def all_users():
    users = User.query.all()
    if len(users) == 0:
        return jsonify({"message": "No User Found"}), 404
    return marshal(users, user_fields)
