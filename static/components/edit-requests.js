export default {
    template: `
    <div class="send-ad-request-container">
        <h2 class="page-title">Edit</h2>
        <div v-if="campaign" class="campaign-details">
            <h3>Campaign Details</h3>
            <div class="details-grid">
                <div><strong>Name:</strong> {{ campaign.name }}</div>
                <div><strong>Description:</strong> {{ campaign.description }}</div>
                <div><strong>Start Date:</strong> {{ campaign.start_date }}</div>
                <div><strong>End Date:</strong> {{ campaign.end_date }}</div>
                <div><strong>Proposed Budget:</strong> {{ adRequest.proposed_budget }}</div>
            </div>
        </div>

        <!-- Edit Form -->
        <div class="negotiation-form">
            <h3>Edit Proposed Budget</h3>
            <form @submit.prevent="submitProposal">
                <div class="form-group">
                    <label for="budget">New Proposal:</label>
                    <input 
                        type="number" 
                        id="budget" 
                        v-model.number="newBudget"
                        placeholder="Enter your proposed budget"
                        min="0"
                        required
                    />
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn">Submit Proposal</button>
                </div>
            </form>
        </div>
    </div>
    `,
    data() {
        return {
            user: { id: null },
            campaign: {
                id: null,
                name: "",
                description: "",
                start_date: "",
                end_date: "",
                visibility: true,
            },
            adRequest: {
                id: null,
                sent_by: null,
                proposed_budget: null,
                flag: null,
            },
            requestdata: null,
            token: localStorage.getItem("auth-token"),
            newBudget: null, // Added to bind to the input for new budget
            proposedBudgets: {},
        };
    },
    methods: {
        async user_info() {
            const response = await fetch('/api/current-user', {
                headers: { "Authentication-Token": this.token },
            });
            if (response.ok) this.user.id = (await response.json()).id;
        },
        async fetchCampaignDetails() {
            const response = await fetch(`/api/campaigns/${this.campaign.id}`, {
                headers: { 
                    "Content-Type": "application/json",
                    "Authentication-Token": this.token 
                },
            });
            const data = await response.json();
            if (response.ok) {
                this.campaign = data;
            } else{
                alert("failed to fetch campaign details")
                console.log(data.message)
            } 
        },
        async fetchAdRequests() {
            const response = await fetch(`/api/ad_requests/${this.$route.params.id}`, {
                headers: { 
                    "Content-Type": "application/json",
                    "Authentication-Token": this.token 
                },
            });
            const data = await response.json();
            if (response.ok) {
                this.adRequest.id = data.id;
                this.adRequest.sent_by = data.sent_by;
                this.adRequest.proposed_budget = data.payment_amount;
                this.adRequest.flag = data.flagged;
                this.campaign.id = data.campaign_id;
            } else {
                console.error(data.message);
            }
        },
        async submitProposal() {
            if (!this.newBudget || this.newBudget <= 0) {
                alert("Please enter a valid proposed budget.");
                return;
            }
            
            const response = await fetch(`/api/ad_requests/${this.$route.params.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authentication-Token": this.token
                },
                body: JSON.stringify({
                    payment_amount: this.newBudget,
                }),
            });

            if (response.ok) {
                this.proposedBudgets[this.adRequest.sent_by] = (await response.json()).payment_amount;
                // Redirect to the homepage
                this.$router.push('/');
            } else {
                alert("Failed to submit proposal. Please try again.");
            }
        },
    },
    async created() {
        try {
            await this.user_info();
            await this.fetchAdRequests();
            await this.fetchCampaignDetails();
        } catch (error) {
            console.error('Error during component creation:', error);
        }
    },
};
