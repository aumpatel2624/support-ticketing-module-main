import Link from 'next/link';
import LoginForm from '@/components/auth/LoginForm';

export default function LoginPage() {
    return (
        <div className="w-full space-y-8">
            <div className="flex flex-col space-y-2 text-center">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                    Welcome back!
                </h1>
                <p className="text-base text-muted-foreground">
                    Enter your credentials to access your dashboard
                </p>
            </div>

            <div className="py-2">
                <LoginForm />
            </div>

            <div className="text-center text-sm text-muted-foreground">
                New to the platform?{' '}
                <Link href="/register" prefetch={false} className="font-semibold text-primary hover:text-primary/80 hover:underline">
                    Request Access
                </Link>
            </div>
        </div>
    );
}
