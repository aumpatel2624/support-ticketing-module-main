import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function RegisterPage() {
    return (
        <Card className="border-none shadow-lg">
            <CardHeader className="space-y-1 text-center">
                <CardTitle className="text-2xl font-bold">Contact Admin</CardTitle>
                <CardDescription>
                    Registration is currently invite-only.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="text-center text-muted-foreground">
                    Please contact your system administrator to create an account for you.
                </div>
            </CardContent>
            <CardFooter className="flex flex-col">
                <div className="text-sm text-center text-muted-foreground w-full">
                    <Link href="/login" prefetch={false} className="text-primary font-medium hover:underline flex items-center justify-center">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="mr-2 h-4 w-4"
                        >
                            <path d="m15 18-6-6 6-6" />
                        </svg>
                        Back to login
                    </Link>
                </div>
            </CardFooter>
        </Card>
    );
}
