import { getSession } from '@/app/lib/auth';
import { redirect } from 'next/navigation';
import Sidebar from '@/app/components/Sidebar';
import { prisma } from '@/app/lib/prisma';

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getSession();

    if (!session) {
        redirect('/login');
    }

    // Fetch user name
    const user = await prisma.user.findUnique({
        where: { id: session.userId },
        select: { name: true, email: true, role: true },
    });

    return (
        <div className="min-h-screen bg-slate-950 flex">
            <Sidebar
                userRole={session.role}
                userName={user?.name || session.email}
                userEmail={user?.email || session.email}
            />
            <main className="flex-1 ml-[260px] min-h-screen overflow-auto">
                {children}
            </main>
        </div>
    );
}
