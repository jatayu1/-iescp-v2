export default {
    template: `
    <div class="container">
        <div class="card update-campaign-card">
            <div class="card-header bg-warning text-white text-center">
                <h3>Update Campaign</h3>
            </div>
            <div class="custom-card-body bg-body-tertiary">
                <form @submit.prevent="updateCampaign">
                    <div class="custom-form-group">
                        <label for="name">Campaign Name</label>
                        <input
                            type="text"
                            id="name"
                            class="form-control"
                            v-model="campaign.name"
                            placeholder="Enter campaign name"
                            required
                        />
                    </div>

                    <div class="custom-form-group">
                        <label for="description">Description</label>
                        <textarea
                            id="description"
                            class="form-control"
                            v-model="campaign.description"
                            placeholder="Enter campaign description"
                            rows="4"
                            required
                        ></textarea>
                    </div>

                    <div class="custom-form-row">
                        <div class="custom-form-group custom-form-column">
                            <label for="start_date">Start Date</label>
                            <input
                                type="date"
                                id="start_date"
                                class="form-control"
                                v-model="campaign.start_date"
                                required
                            />
                        </div>
                        <div class="custom-form-group custom-form-column">
                            <label for="end_date">End Date</label>
                            <input
                                type="date"
                                id="end_date"
                                class="form-control"
                                v-model="campaign.end_date"
                                required
                            />
                        </div>
                    </div>

                    <div class="custom-form-group">
                        <label for="visibility">Visibility</label>
                        <select
                            id="visibility"
                            class="form-control"
                            v-model="campaign.visibility"
                        >
                            <option :value="true">Public</option>
                            <option :value="false">Private</option>
                        </select>
                    </div>

                    <button type="submit" class="btn btn-warning custom-submit-button">
                        Update Campaign
                    </button>
                </form>
            </div>
        </div>
    </div>
    `,
    data() {
        return {
            campaign: {
                id: null,
                name: "",
                description: "",
                start_date: "",
                end_date: "",
                visibility: true,
            },
            token: localStorage.getItem("auth-token"),
        };
    },
    methods: {
        async fetchCampaignDetails() {
            try {
                const response = await fetch(`/api/campaigns/${this.$route.params.id}`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        "Authentication-Token": this.token,
                    },
                });

                if (response.ok) {
                    this.campaign = await response.json();
                } else {
                    alert("Failed to fetch campaign details.");
                }
            } catch (error) {
                console.error("Error fetching campaign details:", error);
                alert("An error occurred while fetching campaign details.");
            }
        },
        async updateCampaign() {
            try {
                const response = await fetch(`/api/campaigns/${this.campaign.id}`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        "Authentication-Token": localStorage.getItem("auth-token"),
                    },
                    body: JSON.stringify(this.campaign),
                });

                if (response.ok) {
                    this.$router.push("/");
                } else {
                    const error = await response.json();
                    console.error("Failed to update campaign:", error);
                    alert("Failed to update campaign.");
                }
            } catch (error) {
                console.error("Error updating campaign:", error);
                alert("An error occurred while updating the campaign.");
            }
        },
    },
    mounted() {
        this.fetchCampaignDetails();
    },
};
