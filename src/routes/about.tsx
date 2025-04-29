import { Container } from "@/components/container"
import Headings from "@/components/headings"
import { Separator } from "@/components/ui/separator"

const AboutPage = () => {
  return (
    <Container>
      <div className="flex flex-col gap-6 pb-20 select-none">
        <Headings
          title="About AI Interviewer"
          description="Revolutionizing interview preparation with AI technology"
        />
        <Separator />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Our Mission</h2>
            <p className="text-muted-foreground">
              We aim to help job seekers improve their interview skills through
              AI-powered practice sessions, personalized feedback, and expert guidance.
            </p>
          </div>
          
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Why Choose Us</h2>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground cursor-none">
              <li>Advanced AI interview simulation</li>
              <li>Personalized feedback and improvement suggestions</li>
              <li>Industry-specific interview questions</li>
              <li>Flexible practice sessions</li>
            </ul>
          </div>
        </div>
      </div>
    </Container>
  )
}

export default AboutPage