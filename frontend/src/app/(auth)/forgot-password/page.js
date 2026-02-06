import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ForgotPasswordPage() {
    return (
        <Card className="border-none shadow-lg">
            <CardHeader className="space-y-1 text-center">
                <CardTitle className="text-2xl font-bold">Forgot password</CardTitle>
                <CardDescription>
                    Enter your email address and we will send you a link to reset your password
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" placeholder="m@example.com" type="email" required />
                    </div>
                    <Button className="w-full">
                        Send Reset Link
                    </Button>
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
