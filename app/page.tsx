import { DocumentUpload } from "@/components/document-upload";
import { Button } from "@/components/ui/button";
import { Calendar, ExternalLink } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-foreground">CrowdHealth</h1>
            </div>
            <div className="hidden md:flex items-center gap-6">
              <a href="/crowdfunding" className="text-sm font-medium text-muted-foreground hover:text-foreground">
                Crowdfunding
              </a>
              <a href="#" className="text-sm font-medium text-muted-foreground hover:text-foreground">
                How It Works
              </a>
              <a href="#" className="text-sm font-medium text-muted-foreground hover:text-foreground">
                Pricing
              </a>
            </div>
            <div className="flex items-center gap-4">
              <a href="#" className="text-sm font-medium text-muted-foreground hover:text-foreground hidden sm:block">
                Community Member Login
              </a>
              <Button>Join today!</Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          {/* Left Section - Content */}
          <div className="space-y-8">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                400+ Reviews • Excellent 4.9 ★★★★★ on Trustpilot
              </p>
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl lg:text-5xl font-bold leading-tight">
                Experience{" "}
                <span className="text-primary">freedom</span> from health
                insurance
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                CrowdHealth provides you a portfolio of tools, seamlessly woven
                together, that creates a beautiful, low cost healthcare solution.
                We help you find awesome doctors, negotiate your bills, and fund
                those bills through a peer to peer funding platform...for less.
              </p>
              <p className="text-lg font-medium">
                Welcome to an easier way to pay for healthcare. ❤️
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="w-full sm:w-auto">
                Join today!
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" size="lg" className="flex-1 sm:flex-initial">
                  <Calendar className="h-4 w-4 mr-2" />
                  Talk to an expert
                </Button>
                <Button variant="outline" size="lg" className="flex-1 sm:flex-initial">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  How it works
                </Button>
              </div>
            </div>
          </div>

          {/* Right Section - Document Upload */}
          <div className="flex flex-col items-center lg:items-start">
            <div className="w-full space-y-6">
              <div className="text-center lg:text-left">
                <h2 className="text-2xl font-bold mb-2">
                  Upload Your Medical Bill
                </h2>
                <p className="text-muted-foreground">
                  Get started by uploading an image of your medical bill. We'll
                  extract and structure the information for you.
                </p>
              </div>
              <DocumentUpload />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
