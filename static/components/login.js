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

        <!-- Right side with Login Form -->
        <div class="col-md-6 d-flex justify-content-center align-items-center p-5">
        <div class="card shadow p-4" style="width: 25rem;">
            <h3 class="card-title text-center mb-3 text-primary">Login</h3>
            <div class="text-danger mb-2">{{ error }}</div>
            <form @submit.prevent="login">
            <div class="mb-3">
                <label for="user-email" class="form-label">Email address</label>
                <input
                type="email"
                class="form-control"
                id="user-email"
                placeholder="name@example.com"
                v-model="cred.email"
                required
                >
            </div>
            <div class="mb-3">
                <label for="user-password" class="form-label">Password</label>
                <input
                type="password"
                class="form-control"
                id="user-password"
                v-model="cred.password"
                required
                >
            </div>
            <button type="submit" class="btn btn-primary w-100">Login</button>
            </form>
            <hr>
            <div class="text-center">
            <router-link to="/register" class="btn btn-link">Create an account</router-link>
            </div>
        </div>
        </div>
    </div>
    `,
    data() {
        return {
            cred: {
                email: '',
                password: '',
            },
            error: '',
        };
    },
    methods: {
    async login() {
        try {
        const response = await fetch('/user-login', {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json',
            },
            body: JSON.stringify(this.cred),
        });
        const data = await response.json();
        if (response.ok) {
            localStorage.setItem('auth-token', data.token);
            localStorage.setItem('role', data.role);
            this.$router.push('/');
        } else {
            this.error = data.message;
        }
        } catch (error) {
        this.error = 'Something went wrong. Please try again.';
        }
    },
    },
};
