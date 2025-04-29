import { Container } from "@/components/container"
import Headings from "@/components/headings"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useState } from "react"
import { toast } from "sonner"

const ContactPage = () => {
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1000))
    toast.success("Message sent successfully!")
    setLoading(false)
  }

  return (
    <Container>
      <div className="flex flex-col gap-6 pb-20 select-none">
        <Headings
          title="Contact Us"
          description="Get in touch with our team"
        />
        <Separator />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Get in Touch</h2>
            <p className="text-muted-foreground">
              Have questions about our services? We're here to help!
            </p>
            <div className="space-y-2">
              <p className="text-muted-foreground">Email: contact@aiinterviewer.com</p>
              <p className="text-muted-foreground">Phone: (555) 123-4567</p>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <Input required placeholder="Your name" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input required type="email" placeholder="Your email" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Message</label>
              <Textarea required placeholder="Your message" className="min-h-[120px]" />
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? "Sending..." : "Send Message"}
            </Button>
          </form>
        </div>
      </div>
    </Container>
  )
}

export default ContactPage