/**
 * AppLayout — sidebar + main content area.
 */
import SessionSidebar from '../sidebar/SessionSidebar';

export default function AppLayout({ children }) {
    return (
        <div className="flex h-screen bg-gray-50">
            <SessionSidebar />
            <main className="flex-1 flex flex-col min-w-0">
                {children}
            </main>
        </div>
    );
}
