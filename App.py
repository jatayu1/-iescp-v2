from flask import Flask
from flask_security import Security
from application.models import db, User, Role
from config import DevelopmentConfig
from application.resources import api
from application.sec import datastore 
from werkzeug.security import generate_password_hash
from datetime import datetime
from flask_cors import CORS
from application.cache import cache
from application.task import monthly, daily
from application.workers import ContextTask, celery_
from celery.schedules import crontab
import pytz

def create_app():
    app = Flask(__name__)
    app.config.from_object(DevelopmentConfig)
    db.init_app(app)
    api.init_app(app)
    cache.init_app(app)
    celery = celery_
    celery.conf.update(
        broker_url= app.config["CELERY_BROKER_URL"],
        result_backend = app.config["CELERY_RESULT_BACKEND"]
    )
    celery.Task = ContextTask
    app.app_context().push()

    app.secret = Security(app, datastore)
    with app.app_context():
        # import application.views
        db.create_all()
        datastore.find_or_create_role(name='admin',description="User is an admin")
        datastore.find_or_create_role(name='influencer',description="User is an influencer")
        datastore.find_or_create_role(name='sponsor',description="User is a sponsor")
        db.session.commit()
        if not datastore.find_user(email="admin@gmail.com"):
            datastore.create_user(
                username="admin", 
                email="admin@gmail.com",
                password=generate_password_hash("admin"),
                roles = ["admin"],
                registration_date=datetime.now().date()
            )
        db.session.commit()
        with app.app_context():
            import application.views

    return app, celery

app, celery = create_app()

CORS(app)


def timee(): 
    return datetime.datetime.now(pytz.timezone('Asia/Calcutta')) 

@celery.on_after_finalize.connect
def monthly_report(sender, **kwargs):
    # sender.add_periodic_task(30.0,monthly.s(),name="at 30 sec")
    # sender.add_periodic_task(20.0,daily.s(),name="at 20 sec")
    sender.add_periodic_task(
        crontab(hour=17, minute=30, day_of_month="1",nowfun=timee),
        monthly.s(),
    )
    sender.add_periodic_task(
        crontab(hour=1, minute=40, day_of_week="*",nowfun=timee),
        daily.s(),
    )

if __name__ == '__main__':
    app.run(debug=True)