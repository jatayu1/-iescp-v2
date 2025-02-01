export default {
    template: `
    <div class="send-ad-request">
        <h2 class="page-title">Send Ad Request</h2>
        <div v-if="campaign" class="campaign-details">
            <h3>Campaign Details</h3>
            <div class="details-grid">
                <div><strong>Name:</strong> {{ campaign.name }}</div>
                <div><strong>Description:</strong> {{ campaign.description }}</div>
                <div><strong>Start Date:</strong> {{ campaign.start_date }}</div>
                <div><strong>End Date:</strong> {{ campaign.end_date }}</div>
                <div><strong>Budget:</strong> {{ campaign.budget }}</div>
            </div>
        </div>

        <div class="search-bar">
            <div class="search-container">
                <select v-model="searchColumn" class="search-dropdown">
                    <option value="fullname">Full Name</option>
                    <option value="username">Username</option>
                    <option value="email">Email</option>
                    <option value="category">Category</option>
                    <option value="niche">Niche</option>
                </select>
                <input
                    type="text"
                    class="search-input"
                    placeholder="Search..."
                    v-model="searchQuery"
                    @input="filterInfluencers"
                />
                <i class="fas fa-search search-icon"></i>
            </div>
        </div>

        <div v-if="filteredInfluencers.length" class="influencer-selection">
            <div class="container">
                <div class="card influencer-selection-card">
                    <div class="card-header bg-info text-white text-center">
                        <h3>Select an Influencer for Your Campaign</h3>
                    </div>
                    <div class="card-body">
                        <div v-if="filteredInfluencers.length">
                            <table class="table table-hover">
                                <thead>
                                    <tr>
                                        <th>Full Name</th>
                                        <th>Email</th>
                                        <th>Username</th>
                                        <th>Category</th>
                                        <th>Niche</th>
                                        <th>Social Media Details</th>
                                        <th>Proposed Budget</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="influencer in filteredInfluencers" :key="influencer.user_id">
                                        <td>{{ influencer.fullname }}</td>
                                        <td>{{ influencer.email }}</td>
                                        <td>{{ influencer.username }}</td>
                                        <td>{{ influencer.category }}</td>
                                        <td>{{ influencer.niche }}</td>
                                        <td class="followers">
                                            <ul>
                                                <li v-if="influencer.social_links.instagram_followers">
                                                    <div class="social-link">
                                                        <a :href="influencer.social_links.instagram_link" target="_blank" class="instagram">
                                                            <div class="link-content">
                                                                <div class="icon-text">
                                                                    <i class="fab fa-instagram"></i>
                                                                    
                                                                </div>
                                                                <span>{{ influencer.social_links.instagram_followers }} followers</span>
                                                            </div>
                                                        </a>
                                                    </div>
                                                </li>
                                                <li v-if="influencer.social_links.facebook_followers">
                                                    <div class="social-link">
                                                        <a :href="influencer.social_links.facebook_link" target="_blank" class="facebook">
                                                            <div class="link-content">
                                                                <div class="icon-text">
                                                                    <i class="fab fa-facebook-f"></i>
                                                                    
                                                                </div>
                                                                <span>{{ influencer.social_links.facebook_followers }} followers</span>
                                                            </div>
                                                        </a>
                                                    </div>
                                                </li>
                                                <li v-if="influencer.social_links.youtube_followers">
                                                    <div class="social-link">
                                                        <a :href="influencer.social_links.youtube_link" target="_blank" class="youtube">
                                                            <div class="link-content">
                                                                <div class="icon-text">
                                                                    <i class="fab fa-youtube"></i>
                                                                </div>
                                                                <span>{{ influencer.social_links.youtube_followers }} Subscribers</span>
                                                            </div>
                                                        </a>
                                                    </div>
                                                </li>

                                                <li v-if="influencer.social_links.x_followers">
                                                    <div class="social-link">
                                                        <a :href="influencer.social_links.youtube_link" target="_blank" class="x">
                                                            <div class="link-content">
                                                                <div class="icon-text">
                                                                    <i class="fab fa-twitter"></i>
                                                                </div>
                                                                <span>{{ influencer.social_links.x_followers }} followers</span>
                                                            </div>
                                                        </a>
                                                    </div>
                                                </li>

                                                <li v-if="influencer.social_links.linkedin_followers">
                                                    <div class="social-link">
                                                        <a :href="influencer.social_links.linkedin_link" target="_blank" class="linkedin">
                                                            <div class="link-content">
                                                                <div class="icon-text">
                                                                    <i class="fab fa-linkedin-in"></i>
                                                                </div>
                                                                <span>{{ influencer.social_links.linkedin_followers }} followers</span>
                                                            </div>
                                                        </a>
                                                    </div>
                                                </li>
                                            </ul>
                                        </td>
                                        <td>
                                            <input
                                                type="number"
                                                class="form-control"
                                                v-model.number="proposedBudgets[influencer.user_id]"
                                                placeholder="Enter proposed budget"
                                                :disabled="sentAdRequests[influencer.user_id]"
                                            />
                                        </td>
                                        <td>
                                            <button
                                                v-if="!sentAdRequests[influencer.user_id]"
                                                class="btn btn-primary btn-sm"
                                                @click="sendAdRequest(influencer.user_id, proposedBudgets[influencer.user_id])"
                                            >
                                                Send Ad Request
                                            </button>
                                            <button
                                                v-else
                                                class="btn btn-danger btn-sm"
                                                @click="unsendAdRequest(influencer.user_id)"
                                            >
                                                Unsend Request
                                            </button>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <div v-else>
                            <p>No influencers found. Please check back later!</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div v-else class="no-influencers">
            <i class="fas fa-user-slash no-influencers-icon"></i>
            <p class="no-influencers-text">No influencers found. Please try again later!</p>
        </div>
        <div v-if="loading">Loading...</div>
    </div>`,

    data() {
        return {
            user: { id: null },
            campaign: {
                id: null,
                name: "",
                description: "",
                start_date: "",
                end_date: "",
                budget: "",
                visibility: true,
            },
            influencers: [],
            filteredInfluencers: [],
            searchQuery: "",
            searchColumn: "fullname",
            token: localStorage.getItem("auth-token"),
            proposedBudgets: {},
            sentAdRequests: {}, // Changed to reactive object
            
            loading: true,
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
            const response = await fetch(`/api/campaigns/${this.$route.params.id}`, {
                headers: { "Authentication-Token": this.token },
            });
            if (response.ok) {
                this.campaign = await response.json();
                // Reset the state for the new campaign
                this.sentAdRequests = {};
                this.proposedBudgets = {};
                // Refetch ad requests for the new campaign
                await this.fetchAdRequests();
            }
        },
        async fetchInfluencers() {
            try {
                // Fetch all influencers
                const influencersResponse = await fetch("/api/influencer-details", {
                    headers: {
                        "Content-Type": "application/json",
                        "Authentication-Token": this.token,
                    },
                });
                const influencersData = await influencersResponse.json();
        
                // Fetch all ad requests
                const adRequestsResponse = await fetch("/api/ad_requests", {
                    headers: {
                        "Content-Type": "application/json",
                        "Authentication-Token": this.token,
                    },
                });
                const adRequestsData = await adRequestsResponse.json();
        
                if (influencersResponse.ok && adRequestsResponse.ok) {        
                    // Filter ad requests for the current campaign
                    const adRequestsForCampaign = adRequestsData.filter(
                        (request) => request.campaign_id === this.campaign.id
                    );
        
                    // Extract user IDs who sent requests
                    const sentByIds = adRequestsForCampaign.map((request) => request.sent_by);
        
                    // Filter influencers who haven't sent a request
                    this.influencers = this.filteredInfluencers = influencersData.filter(
                        (influencer) => !sentByIds.includes(influencer.user_id)
                    );
                } else {
                    alert("Unable to fetch data");
                    console.error("Influencers Error:", influencersData.message);
                    console.error("Ad Requests Error:", adRequestsData.message);
                }
            } catch (error) {
                console.error("Error fetching data:", error);
                alert("An error occurred while fetching influencers.");
            }
        },
        async fetchAdRequests() {
            const response = await fetch("/api/ad_requests", {
                headers: { "Authentication-Token": this.token },
            });
            if (response.ok) {
                const adRequests = await response.json();
                const campaignRequests = adRequests.filter(request => request.campaign_id === this.campaign.id);
        
                campaignRequests.forEach(request => {
                    if (request.sent_by === this.user.id) {
                        this.$set(this.sentAdRequests, request.sent_to, true);
                        this.$set(this.proposedBudgets, request.sent_to, request.payment_amount);
                    }
                });
            }
            this.loading = false;
        },
        async sendAdRequest(influencerId, budget) {
            if (!budget || budget <= 0) return alert("Please enter a valid proposed budget.");
            const response = await fetch("/api/ad_requests", {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authentication-Token": this.token },
                body: JSON.stringify({
                    campaign_id: this.campaign.id,
                    sent_by: this.user.id,
                    sent_to: influencerId,
                    payment_amount: budget,
                }),
            });
            if (response.ok) {
                this.$set(this.sentAdRequests, influencerId, true);
                this.$set(this.proposedBudgets, influencerId, (await response.json()).payment_amount);
                alert("Ad request sent successfully!");
            }
        },
        async unsendAdRequest(influencerId) {
            const response = await fetch("/api/ad_requests", {
                method: "DELETE",
                headers: { "Content-Type": "application/json", "Authentication-Token": this.token },
                body: JSON.stringify({
                    campaign_id: this.campaign.id,
                    sent_by: this.user.id,
                    sent_to: influencerId,
                }),
            });
            if (response.ok) {
                this.$delete(this.sentAdRequests, influencerId);
                this.$delete(this.proposedBudgets, influencerId);
                alert("Ad request unsent successfully!");
            }
        },
        filterInfluencers() {
            const query = this.searchQuery.toLowerCase();
            if (!query) {
                this.filteredInfluencers = this.influencers;
                return;
            }
        
            this.filteredInfluencers = this.influencers.filter(influencer => {
                const value = influencer[this.searchColumn]?.toString().toLowerCase() || "";
                return value.includes(query);
            });
        },
    },
    async created() {
        try {
            await this.user_info();
            await this.fetchCampaignDetails();
            await this.fetchInfluencers();
            await this.fetchAdRequests();
        } catch (error) {
            console.error('Error during component creation:', error);
        }
    },
};
