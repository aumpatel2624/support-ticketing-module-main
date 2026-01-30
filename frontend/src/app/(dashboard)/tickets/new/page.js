import PageHeader from '@/components/common/PageHeader';
import CreateTicketForm from '@/components/tickets/CreateTicketForm';
import { Card, CardContent } from '@/components/ui/card';

export default function CreateTicketPage() {
    return (
        <div className="space-y-6">
            <PageHeader
                heading="Create New Ticket"
                text="Submit a new support request to the help desk."
            />

            <Card>
                <CardContent className="pt-6">
                    <CreateTicketForm />
                </CardContent>
            </Card>
        </div>
    );
}
