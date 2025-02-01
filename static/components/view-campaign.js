export default {
    template: `
    <div v-if="campaign" class="campaign-container">
        <div class="campaign-details">
            <h2>Campaign Details</h2>
            <div class="details-group">
                <p><strong>Name:</strong> {{ campaign.name }}</p>
                <p><strong>Description:</strong> {{ campaign.description }}</p>
                <p><strong>Start Date:</strong> {{ campaign.start_date }}</p>
                <p><strong>End Date:</strong> {{ campaign.end_date }}</p>
                <p><strong>Budget:</strong> {{ campaign.budget }}</p>
                <p><strong>Visibility:</strong> {{ campaign.visibility ? "Public" : "Private" }}</p>
                <p><strong>Status:</strong> {{ statusLabels[campaign.status] }}</p>
            </div>
        </div>

        <div v-if="creator" class="creator-details">
            <h3>Creator Details</h3>
            <div class="details-group">
                <p><strong>Full Name:</strong> {{ creator.fullname }}</p>
                <p><strong>Username:</strong> {{ creator.username }}</p>
                <p><strong>Email:</strong> {{ creator.email }}</p>
            </div>
        </div>

        <!-- Ad request section -->
        <div v-if="userRole === 'influencer' && campaign.visibility && campaign.status === 0" class="ad-request-section">
            <h3 v-if="!adRequestExists">Send Ad Request</h3>
            <h3 v-else>Ad Request Already Sent</h3>
            <div class="payment-form" v-if="!adRequestExists">
                <input
                    v-model="proposedAmount"
                    type="number"
                    placeholder="Enter proposed payment amount"
                    min="1"
                    class="payment-input"
                />
                <button @click="sendAdRequest" class="send-request-button">Send</button>
            </div>
            <div v-else>
                <p>Your ad request has already been sent.</p>
            </div>
        </div>
    </div>
    <div v-else class="loading-message">
        <p>Loading campaign details...</p>
    </div>
    `,
    data() {
        return {
            user: {
                id: null,
            },
            campaign: null,
            creator: null,
            proposedAmount: null, // Holds the proposed payment amount
            adRequestExists: false, // Flag to check if an ad request has been sent
            statusLabels: {
                0: "Draft",
                1: "Active",
                2: "Completed",
            },
        };
    },
    computed: {
        userRole() {
            return localStorage.getItem("role");
        },
    },
    async created() {
        try {
            const campaignId = this.$route.params.id;
            const response = await fetch(`/api/campaigns/${campaignId}`, {
                headers: {
                    "Content-Type": "application/json",
                    "Authentication-Token": localStorage.getItem("auth-token"),
                },
            });

            if (response.ok) {
                const data = await response.json();
                this.campaign = data;

                if (data.created_by) {
                    const creatorResponse = await fetch(`/api/users/${data.created_by}`, {
                        headers: {
                            "Content-Type": "application/json",
                            "Authentication-Token": localStorage.getItem("auth-token"),
                        },
                    });

                    if (creatorResponse.ok) {
                        const creatorData = await creatorResponse.json();
                        this.creator = creatorData;
                    } else {
                        console.error("Failed to fetch creator details");
                    }
                }
                await this.user_info();
                await this.checkAccess();
                await this.checkAdRequestStatus(); // Check if an ad request already exists
            } else {
                console.error("Failed to fetch campaign details");
            }
        } catch (error) {
            console.error("An error occurred while fetching campaign details:", error);
        }
    },
    methods: {
        async user_info() {
            const response = await fetch('/api/current-user', {
                headers: { "Authentication-Token": localStorage.getItem("auth-token") },
            });
            if (response.ok) {
                const userData = await response.json();
                this.user.id = userData.id;
            } else {
                console.error("Failed to fetch user info");
            }
        },
        checkAccess() {
            const { visibility, created_by, assigned_to } = this.campaign;
            const userId = this.user.id;
            const userRole = this.userRole;
    
            if (
                visibility || // Public campaign
                userRole === "admin" || // Admin can always access
                created_by === userId || // Creator can access
                assigned_to === userId // Assigned user can access
            ) {
                return true;
            }
    
            // Additional checks can be added here if needed
            alert("You do not have permission to view this campaign.");
            this.$router.push("/"); // Redirect to another page, such as a dashboard or campaigns list
            return false;
        },
        async checkAdRequestStatus() {
            try {
                const response = await fetch(`/api/ad_requests?campaign_id=${this.campaign.id}&sent_by=${this.user.id}`, {
                    headers: {
                        "Content-Type": "application/json",
                        "Authentication-Token": localStorage.getItem("auth-token"),
                    },
                });
                if (response.ok) {
                    const adRequests = await response.json();
                    this.adRequestExists = adRequests.length > 0;
                } else {
                    console.error("Failed to check ad request status");
                }
            } catch (error) {
                console.error("An error occurred while checking ad request status:", error);
            }
        },
        async sendAdRequest() {
            if (!this.proposedAmount || this.proposedAmount <= 0) {
                alert("Please enter a valid payment amount.");
                return;
            }
    
            try {
                const campaignId = this.campaign.id;
                const response = await fetch(`/api/ad_requests`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authentication-Token": localStorage.getItem("auth-token"),
                    },
                    body: JSON.stringify({
                        campaign_id: campaignId,
                        sent_to: this.creator.id, // Assumes creator is the recipient of the request
                        sent_by: this.user.id,
                        payment_amount: this.proposedAmount, // Include the proposed payment amount
                    }),
                });
    
                if (response.ok) {
                    alert("Ad request sent successfully!");
                    this.proposedAmount = null; // Reset the input field
                    this.adRequestExists = true; // Set the flag to true
                } else {
                    console.error("Failed to send ad request");
                    alert("Failed to send ad request. Please try again.");
                }
            } catch (error) {
                console.error("An error occurred while sending ad request:", error);
                alert("An error occurred while sending the request. Please try again.");
            }
        },
    },
}
