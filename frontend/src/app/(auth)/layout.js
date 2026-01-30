import { CheckCircle2 } from 'lucide-react';
import Image from 'next/image';

export const metadata = {
    title: 'Login - Ticketing System',
    description: 'Login to your account',
};

export default function AuthLayout({ children }) {
    return (
        <div className="min-h-screen flex w-full">
            {/* Left Side - Brand & Info (Hidden on mobile) */}
            <div className="hidden lg:flex w-1/2 bg-primary flex-col justify-between p-12 text-primary-foreground relative overflow-hidden">
                {/* Decorative background pattern could go here */}

                {/* Logo */}
                <div className="z-10">
                    <div className="bg-white text-primary rounded-lg px-6 py-3 inline-flex items-center mb-8 shadow-sm">
                        <Image
                            src="/logo.webp"
                            alt="APIDEL Logo"
                            width={180}
                            height={40}
                            className="h-8 w-auto"
                            priority
                        />
                    </div>

                    <h1 className="text-4xl font-bold font-heading mb-6 leading-tight max-w-lg">
                        Support Ticketing<br />System
                    </h1>

                    <div className="space-y-4 max-w-md">
                        <div className="flex items-center gap-3">
                            <div className="bg-white/20 p-1 rounded-full">
                                <CheckCircle2 className="h-4 w-4" />
                            </div>
                            <span className="font-medium text-lg">Streamline support.</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="bg-white/20 p-1 rounded-full">
                                <CheckCircle2 className="h-4 w-4" />
                            </div>
                            <span className="font-medium text-lg">Structure requests.</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="bg-white/20 p-1 rounded-full">
                                <CheckCircle2 className="h-4 w-4" />
                            </div>
                            <span className="font-medium text-lg">Scale resolution.</span>
                        </div>
                    </div>

                    <p className="mt-8 text-primary-foreground/80 max-w-md leading-relaxed">
                        A centralized platform to manage support requests, track issues, and streamline resolution workflows with clarity and control.
                    </p>
                </div>

                {/* Footer */}
                <div className="z-10 text-sm text-primary-foreground/60">
                    © {new Date().getFullYear()} APIDEL. Value Delivered.
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="flex-1 flex items-center justify-center p-4 md:p-8 bg-white">
                <div className="w-full max-w-md">
                    {children}
                </div>
            </div>
        </div>
    );
}
