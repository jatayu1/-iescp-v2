export default {
    template: `
        <div class="container-fluid vh-100 d-flex p-0">
            <!-- Left side with About text -->
            <div class="col-md-6 d-flex flex-column justify-content-center align-items-center text-white bg-primary p-5">
                <h1>Welcome to IESCPE</h1>
                <p class="mt-3 fs-5">
                    Connecting sponsors and influencers seamlessly. Manage partnerships, build connections, 
                    and make your campaigns successful—all in one platform.
                </p>
            </div>

            <!-- Right side with Sign Up Form -->
            <div class="col-md-6 d-flex justify-content-center align-items-center p-5">
                <div class="card shadow p-4" style="width: 28rem;">
                    <h3 class="card-title text-center mb-3 text-primary">Create an Account</h3>
                    <div class="text-danger mb-2">{{ error }}</div>
                    <form @submit.prevent="register">
                        <!-- User Type (Radio Buttons) -->
                        <div class="mb-3 d-flex align-items-center">
                            <label class="form-label me-3 mb-0">I am a:</label>
                            <div class="form-check me-3">
                                <input 
                                    class="form-check-input" 
                                    type="radio" 
                                    id="influencer" 
                                    value="influencer" 
                                    v-model="cred.role" 
                                    required
                                />
                                <label class="form-check-label" for="influencer">Influencer</label>
                            </div>
                            <div class="form-check">
                                <input 
                                    class="form-check-input" 
                                    type="radio" 
                                    id="sponsor" 
                                    value="sponsor" 
                                    v-model="cred.role"
                                />
                                <label class="form-check-label" for="sponsor">Sponsor</label>
                            </div>
                        </div>

                        <!-- Fullname and Username in one row -->
                        <div class="row mb-3">
                            <div class="col-md-6">
                                <input 
                                    type="text" 
                                    class="form-control" 
                                    id="fullname" 
                                    placeholder="Full Name" 
                                    v-model="cred.fullname" 
                                    required 
                                />
                            </div>
                            <div class="col-md-6">
                                <input 
                                    type="text" 
                                    class="form-control" 
                                    id="username" 
                                    placeholder="Username" 
                                    v-model="cred.username" 
                                    required 
                                />
                            </div>
                        </div>

                        <!-- Email -->
                        <div class="mb-3">
                            <input 
                                type="email" 
                                class="form-control" 
                                id="email" 
                                placeholder="Email" 
                                v-model="cred.email" 
                                required 
                            />
                        </div>

                        <!-- Password and Confirm Password in one row -->
                        <div class="row mb-3">
                            <div class="col-md-6">
                                <input 
                                    type="password" 
                                    class="form-control" 
                                    id="password" 
                                    placeholder="Password" 
                                    v-model="cred.password" 
                                    required 
                                />
                            </div>
                            <div class="col-md-6">
                                <input 
                                    type="password" 
                                    class="form-control" 
                                    id="confirm-password" 
                                    placeholder="Confirm Password" 
                                    v-model="cred.confirm_password" 
                                    required 
                                />
                            </div>
                        </div>

                        <!-- Submit Button -->
                        <button type="submit" class="btn btn-primary w-100">Register</button>
                    </form>
                    <hr>
                    <div class="text-center">
                        <router-link to="/login" class="btn btn-link">Already have an account?</router-link>
                    </div>
                </div>
            </div>
        </div>
    `,
    data() {
        return {
            cred: {
                role: '', 
                fullname: '',
                username: '',
                email: '',
                password: '',
                confirm_password: '',
            },
            error: '',
        };
    },
    methods: {
        async register() {
            try {
                // Frontend password match validation
                if (this.cred.password !== this.cred.confirm_password) {
                    this.error = "Passwords do not match.";
                    return;  // Stop further execution if passwords don't match
                }

                const response = await fetch('/api/users', {
                    method: 'POST',
                    headers : {
                        "Content-Type" : "application/json"
                    },
                    body : JSON.stringify(this.cred),
                });

                const data = await response.json();

                if (response.ok) {
                    this.$router.push('/login');
                } else {
                    this.error = data.message || 'Registration failed. Please try again.';
                }
            } catch (error) {
                this.error = 'Something went wrong. Please try again.';
            }
        },
    },
};
