export default {
    template: `
    <div class="profile-container">
        <h1 class="profile-title">Update Profile</h1>

        <transition name="fade">
        <div class="profile-section" v-if="true">
            <h2>User Details</h2>
            <form @submit.prevent="updateUserDetails">
            <div class="form-group">
                <label for="fullname">Full Name</label>
                <input
                v-model="user.fullname"
                type="text"
                id="fullname"
                placeholder="Full Name"
                required
                />
            </div>
            <div class="form-group">
                <label for="email">Email</label>
                <input
                v-model="user.email"
                type="email"
                id="email"
                placeholder="Email"
                required
                />
            </div>
            <div class="form-group">
                <label for="password">Password</label>
                <input
                v-model="user.password"
                type="password"
                id="password"
                placeholder="New Password"
                />
            </div>
            <button class="btn btn-primary animated-button" type="submit">
                Update User Details
            </button>
            </form>
        </div>
        </transition>

        <transition name="slide-up">
        <div v-if="role === 'influencer'" class="profile-section">
            <h2>Influencer Details</h2>
            <form @submit.prevent="updateInfluencerDetails">
            <div class="form-group">
                <label for="category">Category</label>
                <input v-model="influencer.category" type="text" id="category" placeholder="Category" />
            </div>
            <div class="form-group">
                <label for="niche">Niche</label>
                <input v-model="influencer.niche" type="text" id="niche" placeholder="Niche" />
            </div>
            
            <div class="form-group">
                <label for="instagram_link">Instagram Link</label>
                <input
                v-model="influencer.instagram_link"
                type="url"
                id="instagram_link"
                placeholder="Instagram Link"
                />
            </div>

            <div class="form-group">
                <label for="instagram_followers">Instagram Followers</label>
                <input
                v-model="influencer.instagram_followers"
                type="number"
                id="instagram_followers"
                />
            </div>

            <div class="form-group">
                <label for="facebook_link">Facebook Link</label>
                <input
                v-model="influencer.facebook_link"
                type="url"
                id="facebook_link"
                placeholder="Facebook Link"
                />
            </div>

            <div class="form-group">
                <label for="facebook_followers">Facebook Followers</label>
                <input
                v-model="influencer.facebook_followers"
                type="number"
                id="facebook_followers"
                />
            </div>

            <div class="form-group">
                <label for="youtube_link">YouTube Link</label>
                <input
                v-model="influencer.youtube_link"
                type="url"
                id="youtube_link"
                placeholder="YouTube Link"
                />
            </div>

            <div class="form-group">
                <label for="youtube_followers">YouTube Subscribers</label>
                <input
                v-model="influencer.youtube_followers"
                type="number"
                id="youtube_followers"
                />
            </div>

            <div class="form-group">
                <label for="x_link">X (Twitter) Link</label>
                <input
                v-model="influencer.x_link"
                type="url"
                id="x_link"
                placeholder="X (Twitter) Link"
                />
            </div>

            <div class="form-group">
                <label for="x_followers">X (Twitter) Followers</label>
                <input
                v-model="influencer.x_followers"
                type="number"
                id="x_followers"
                />
            </div>

            <div class="form-group">
                <label for="linkedin_link">LinkedIn Link</label>
                <input
                v-model="influencer.linkedin_link"
                type="url"
                id="linkedin_link"
                placeholder="LinkedIn Link"
                />
            </div>

            <div class="form-group">
                <label for="linkedin_followers">LinkedIn Followers</label>
                <input
                v-model="influencer.linkedin_followers"
                type="number"
                id="linkedin_followers"
                />
            </div>

            <button class="btn btn-primary animated-button" type="submit">
                Update Influencer Details
            </button>
            </form>
        </div>
        </transition>

        <transition name="fade">
        <div v-if="role === 'sponsor'" class="profile-section">
            <h2>Sponsor Details</h2>
            <form @submit.prevent="updateSponsorDetails">
            <div class="form-group">
                <label for="industry">Industry</label>
                <input v-model="sponsor.industry" type="text" id="industry" placeholder="Industry" />
            </div>
            <button class="btn btn-primary animated-button" type="submit">
                Update Sponsor Details
            </button>
            </form>
        </div>
        </transition>

        <transition name="bounce">
        <div class="profile-section">
            <button class="btn btn-danger animated-button" @click="deleteProfile">
            Delete Profile
            </button>
        </div>
        </transition>
    </div>
    `,
    data() {
        return {
            role: localStorage.getItem("role"), // Get the user's role (influencer/sponsor)
            token: localStorage.getItem("auth-token"),
            user: {
                id : "",
                fullname: "",
                email: "",
                password: "",
            },
            influencer: {
                category: "",
                niche: "",

                instagram_link: "",
                instagram_followers: 0,
                facebook_link: "",
                facebook_followers: 0,
                youtube_link: "",
                youtube_followers: 0,
                x_link: "",
                x_followers: 0,
                linkedin_link: "",
                linkedin_followers: 0,
            },
            sponsor: {
                industry: "",
            },
        };
    },
    methods: {
        async fetchProfileDetails() {
            const response = await fetch("/api/current-user", {
                method: "GET",
                headers: {
                "Authentication-Token": this.token,
                },
            });
            const userData = await response.json();
            if (response.ok) {
                this.user = {
                    id: userData.id,
                    fullname: userData.fullname,
                    email: userData.email,
                    password: "", // Intentionally left blank for privacy
                };
        
                if (this.role === "influencer") {
                    const influencerResponse = await fetch(`/api/influencer-details/${this.user.id}`, {
                        method: "GET",
                        headers: {
                        "Authentication-Token": this.token,
                        },
                    });
                    const influencerData = await influencerResponse.json();
                    if (influencerResponse.ok) {
                        this.influencer.category = influencerData.category;
                        this.influencer.niche = influencerData.niche;

                        this.influencer.instagram_link = influencerData.social_links.instagram_link;
                        this.influencer.instagram_followers = influencerData.social_links.instagram_followers;
                        this.influencer.facebook_link = influencerData.social_links.facebook_link;
                        this.influencer.facebook_followers = influencerData.social_links.facebook_followers;
                        this.influencer.youtube_link = influencerData.social_links.youtube_link;
                        this.influencer.youtube_followers = influencerData.social_links.youtube_followers;
                        this.influencer.x_link = influencerData.social_links.x_link;
                        this.influencer.x_followers = influencerData.social_links.x_followers;
                        this.influencer.linkedin_link = influencerData.social_links.linkedin_link;
                        this.influencer.linkedin_followers = influencerData.social_links.linkedin_followers;
                    }
                }
        
                if (this.role === "sponsor") {
                    const sponsorResponse = await fetch(`/api/sponsor-details/${this.user.id}`, {
                        method: "GET",
                        headers: {
                        "Authentication-Token": this.token,
                        },
                    });
                    const sponsorData = await sponsorResponse.json();
                    if (sponsorResponse.ok) {
                        this.sponsor = sponsorData;
                    }else {
                        console.log(sponsorData);
                    }
                }
            }
        },
        async updateUserDetails() {
            const response = await fetch("/api/current-user", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authentication-Token": this.token,
                },
                body: JSON.stringify(this.user),
            });
            if (response.ok) {
                alert("User details updated successfully!");
            } else {
                alert("Failed to update user details.");
            }
        },
        async updateInfluencerDetails() {
            const response = await fetch("/api/current-user", {
                method: "PUT",
                headers: {
                "Content-Type": "application/json",
                "Authentication-Token": this.token,
                },
                body: JSON.stringify(this.influencer),
            });
            if (response.ok) {
                alert("Influencer details updated successfully!");
            } else {
                alert("Failed to update influencer details.");
            }
        },
        async updateSponsorDetails() {
            const response = await fetch("/api/current-user", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authentication-Token": this.token,
                },
                body: JSON.stringify(this.sponsor),
            });
            if (response.ok) {
                alert("Sponsor details updated successfully!");
            } else {
                alert("Failed to update sponsor details.");
            }
        },
        async deleteProfile() {
            if (confirm("Are you sure you want to delete your profile?")) {
                const response = await fetch(`/api/current-user`, {
                method: "DELETE",
                    headers: {
                        "Authentication-Token": this.token,
                    },
                });
                if (response.ok) {
                    alert("Profile deleted successfully.");

                    localStorage.removeItem("auth-token");
                    localStorage.removeItem("role");
                    
                    window.location.href = "/logout";
                } else {
                    alert("Failed to delete profile.");
                }
            }
        },
    },
    async created() {
        await this.fetchProfileDetails();
    },
};
