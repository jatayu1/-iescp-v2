from application.workers import celery_
from jinja2 import Template
from weasyprint import HTML
from application.mail import send_email
import csv
from application.models import User, Role, AdRequest
from datetime import date, timedelta
import os
import io
from io import StringIO



def format_report(template1,data,User="User"):
    with open(template1) as file:
        temp = Template(file.read())
        return temp.render(data=data,User=User)

def pdf_report(data, User):
    try:
        # Generate the HTML content
        msg = format_report("./templates/monthly.html", data=data, User=User)
        
        # Convert HTML to PDF
        html = HTML(string=msg)

        # Use a fixed absolute path for saving the PDF
        file_name = f"{User}_monthly_report.pdf"
        output_path = os.path.join(os.getcwd(), file_name)
        print(f"Saving PDF to: {output_path}")
        
        # Generate the PDF
        html.write_pdf(target=output_path)
        print("PDF successfully created.")
        
        return output_path
    except Exception as e:
        print(f"Error in pdf_report: {e}")
        return None

@celery_.task()
def monthly():
    sponsors = User.query.filter(User.roles.any(Role.name == 'sponsor')).all()

    # sponsors
    for sponsor in sponsors:
        email = sponsor.email
        username = sponsor.username
        sponsor_dict = {
            'sponsor_email' : sponsor.email, 
            "sponsor_name" : sponsor.fullname, 
            "campaign_details": [],
            'total_campaigns': 0,
            'ended_campaigns_last_month': 0,
            'budget_spent_last_month': 0
        }

        # Get today's date
        today = date.today()

        # Get the first day of this month
        first_day_this_month = today.replace(day=1)

        # Get the last day of last month
        last_day_last_month = first_day_this_month - timedelta(days=1)

        # Get the first day of last month
        first_day_last_month = last_day_last_month.replace(day=1)

        print(f"Last month started on: {first_day_last_month}")
        print(f"Last month ended on: {last_day_last_month}")


        # Campaign processing
        for campaign in sponsor.created_campaigns:
            # Check if the campaign was active or ended during the last month
            if campaign.end_date >= first_day_last_month and campaign.start_date <= last_day_last_month:
                # Add campaign details
                sponsor_dict['campaign_details'].append({
                    'campaign_name': campaign.name,
                    'campaign_description': campaign.description,
                    'campaign_start_date': campaign.start_date.strftime("%Y-%m-%d"),
                    'campaign_end_date': campaign.end_date.strftime("%Y-%m-%d"),
                    'campaign_budget': campaign.budget or 0,
                    'campaign_status': "Active" if campaign.status == 1 else "Draft" if campaign.status == 0 else "Completed",
                    'campaign_flagged': "Yes" if campaign.flagged else "No",
                    'campaign_assigned_to': campaign.assigned_to
                })

            # Count campaigns that ended in the last month
            if first_day_last_month <= campaign.end_date <= last_day_last_month:
                sponsor_dict['ended_campaigns_last_month'] += 1
                sponsor_dict['budget_spent_last_month'] += campaign.budget or 0

        # Total campaigns in the last month
        sponsor_dict['total_campaigns'] = len(sponsor_dict['campaign_details'])

        # Generate PDF report
        pdf_path = pdf_report(sponsor_dict, username)
        if pdf_path and os.path.exists(pdf_path):
            print(f"PDF generated at: {pdf_path}")
        else:
            print(f"PDF generation failed for sponsor: {username}")
            continue  # Skip sending email if PDF is not generated
        
        with open('./templates/monthly.html','r') as f:
            template = Template(f.read())
        send_email(email,'Monthly Reminder',template.render(user=username, data = sponsor_dict),content="html", attachment=pdf_path)
    return "Monthly reminder sent"

@celery_.task()
def daily():
     # Fetch influencers
    influencers = (
        User.query
        .filter(User.roles.any(Role.name == 'influencer'))
        .all()
    )

    for influencer in influencers:
        email = influencer.email
        fullname = influencer.fullname

        # Get pending ad requests
        pending_requests = (
            AdRequest.query
            .filter(AdRequest.sent_to == influencer.id)
            .all()
        )

        # Count flagged incoming ad requests
        flagged_incoming = (
            AdRequest.query
            .filter(AdRequest.sent_to == influencer.id, AdRequest.flagged == True)
            .count()
        )

        # Count flagged outgoing ad requests
        flagged_outgoing = (
            AdRequest.query
            .filter(AdRequest.sent_by == influencer.id, AdRequest.flagged == True)
            .count()
        )

        # Check if the influencer's profile is flagged
        profile_flagged = influencer.flagged

        # Render email content with dynamic data
        rendered_content = {
            'pending_requests' : len(pending_requests),
            'profile_status' : "Flagged" if profile_flagged else "Safe",
            'flagged_incoming' : flagged_incoming,
            'flagged_outgoing' : flagged_outgoing,
            'visit_url' : "http://127.0.0.1:5000/" 
        }

        with open('./templates/daily.html','r') as f:
            template = Template(f.read())
        send_email(email,'Daily Reminder',template.render(user=fullname, email=email, data=rendered_content),content="html")
    return "Daily reminder sent"

import tempfile

@celery_.task()
def exportjob(data, email, username):
    # Parse the CSV data
    csv_reader = csv.DictReader(io.StringIO(data))
    campaigns = list(csv_reader)

    # Debug logging
    print("Parsed campaigns:", campaigns)

    # Create in-memory CSV
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=[
        'name', 'description', 'start_date', 'end_date',
        'budget', 'visibility', 'status', 'flagged',
        'created_by', 'assigned_to'
    ])
    writer.writeheader()
    writer.writerows(campaigns)
    csv_content = output.getvalue()

    # Create a temporary file to store the CSV
    with tempfile.NamedTemporaryFile(delete=False, suffix=".csv") as temp_file:
        temp_file.write(csv_content.encode('utf-8'))  # Write CSV content to the file
        temp_file_path = temp_file.name  # Get the temporary file path

    try:
        # Read the email template and render it
        with open('./templates/export-camp.html', 'r') as f:
            template = Template(f.read())
        email_body = template.render(user=username, data=campaigns)

        # Send the email with the temporary file as an attachment
        send_email(
            to_address=email,
            subject="Exported Campaign Details",
            message=email_body,
            content="html",
            attachment=temp_file_path,  # Pass the file path
            attachment_filename="export-campaigns.csv"
        )
    finally:
        # Clean up the temporary file
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)

    return "CSV created and email sent."
