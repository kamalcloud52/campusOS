/**
 * 404 Page Component
 * Displayed when a route is not found
 */

const NotFoundPage = {
    render: () => {
        return `
            <div class="error-page" style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; padding: 2rem; text-align: center;">
                <i class="fas fa-compass" style="font-size: 5rem; color: var(--primary-400); margin-bottom: 1rem;"></i>
                <h1 style="font-size: 6rem; font-weight: 700; color: var(--primary-600); margin-bottom: 0.5rem;">404</h1>
                <h2 style="margin-bottom: 0.5rem;">Page Not Found</h2>
                <p style="color: var(--gray-500); margin-bottom: 2rem;">The page you're looking for doesn't exist or has been moved.</p>
                <div style="display: flex; gap: 1rem; flex-wrap: wrap; justify-content: center;">
                    <button onclick="window.location.hash='#/dashboard'" class="btn btn-primary">
                        <i class="fas fa-home"></i>
                        Go to Dashboard
                    </button>
                    <button onclick="window.history.back()" class="btn btn-outline">
                        <i class="fas fa-arrow-left"></i>
                        Go Back
                    </button>
                </div>
            </div>
        `;
    },
    
    beforeRender: () => {
        // No auth needed for 404 page
        return true;
    },
    
    afterRender: () => {
        // Update document title
        document.title = '404 - Page Not Found | Campus Survival OS';
    }
};

export default NotFoundPage;
