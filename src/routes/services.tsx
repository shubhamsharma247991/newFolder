import { Container } from "@/components/container"
import Headings from "@/components/headings"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const ServicesPage = () => {
  const services = [
    {
      title: "Mock Interviews",
      description: "Practice with AI-powered interview simulations tailored to your industry"
    },
    {
      title: "Instant Feedback",
      description: "Receive detailed feedback on your responses and areas for improvement"
    },
    {
      title: "Custom Questions",
      description: "Access industry-specific questions based on your job preferences"
    },
    {
      title: "Performance Analysis",
      description: "Track your progress and identify areas needing improvement"
    }
  ]

  return (
    <Container>
      <div className="flex flex-col gap-6 pb-20 select-none">
        <Headings
          title="Our Services"
          description="Comprehensive interview preparation solutions"
        />
        <Separator />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          {services.map((service, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle>{service.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  {service.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Container>
  )
}

export default ServicesPage