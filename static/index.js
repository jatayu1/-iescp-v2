import router from "./router.js"
import Navbar from "./components/navbar.js"

router.beforeEach((to, from, next) => {
    const isLoggedIn = localStorage.getItem('auth-token') ? true : false;
    
    // Allow access to 'Login' and 'Register' routes even when not logged in
    if (!isLoggedIn && (to.name !== 'Login' && to.name !== 'Register')) {
        next({ name: 'Login' }); // Redirect to Login if not authenticated
    } else {
        next(); // Allow navigation
    }
});

new Vue({
    el : "#app",

    template: `<div>
    <Navbar :key='has_changed'/>
    <router-view />
    </div>`,

    router,

    components : {
        Navbar,
    },

    data : {
        has_changed : true,
    },

    watch : {
        $route(to, from){
            this.has_changed = !this.has_changed
        }
    }
})