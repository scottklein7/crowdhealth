import { DocumentUpload } from "@/components/document-upload";
import { Button } from "@/components/ui/button";
import { Shell } from "lucide-react";
import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <main className="relative isolate overflow-hidden">
        {/* Top hero band with Nautilus colors */}
        <div className="relative">
          <div className="h-[470px] md:h-[320px] w-full bg-[#15486b]">
            <div className="container mx-auto h-full px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <div className="flex bg-white items-center justify-center rounded-full  p-3 shadow-md shadow-black/20">
                <Image
                  src="/snail.png"
                  alt="Nautilus Builders, Inc."
                  height={150}
                  width={150}
                  className="h-40 w-40 object-contain"
                />
              </div>
              <div className="text-center sm:text-left">
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-[#f2af58] italic drop-shadow-sm">
                  Nautilus Builders, Inc.&reg;
                </h2>
                <p className="mt-1 text-xs md:text-sm text-[#f9d9a2]/90 tracking-[0.2em] uppercase">
                  Project Management Workspace
                </p>
              </div>
            </div>
          </div>

          {/* Overlapping content card */}
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="-mt-16 md:-mt-20 lg:-mt-24 mb-16">
              <div className="relative rounded-xl bg-card shadow-xl shadow-black/10 border border-border/70 px-6 py-6 sm:px-10 sm:py-8 lg:px-12 lg:py-10">
                {/* Nautilus shell watermark */}
                <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 opacity-70">
                  <div className="absolute inset-0 rounded-full bg-linear-to-br from-primary/10 via-primary/5 to-primary/0 blur-2xl" />
                  <img
                    src="/nautilus-shell.svg"
                    alt=""
                    className="relative h-full w-full"
                  />
                </div>

                <div className="grid lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] gap-10 items-start">
                  {/* Left copy */}
                  <div className="space-y-5 max-w-xl">
                    <div className="inline-flex items-center gap-2 rounded-full bg-[#fdf3e6] px-3 py-1 text-xs font-medium text-[#f7941d]">
                      <Shell className="h-4 w-4" />
                      Nautilus Builders · PM tools
                    </div>

                    <div className="space-y-2">
                      <h1 className="text-3xl md:text-4xl lg:text-5xl font-semibold leading-tight text-[#f2af58]">
                        Capture site notes once, use them everywhere
                      </h1>
                      <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                        This workspace is for project managers and supers only. It takes
                        handwritten notes from the field and turns them into clean,
                        structured text you can paste straight into Procore, Microsoft
                        Word, Google Docs, emails, or change orders.
                      </p>
                    </div>

                    <div className="space-y-2 text-xs md:text-sm text-muted-foreground leading-relaxed">
                      <p>
                        1. At the job, jot your notes like you normally do (scope,
                        materials, labor, questions, issues).
                      </p>
                      <p>
                        2. Back in the truck or office, take a clear photo and upload
                        it on the right. One notebook page per upload works best.
                      </p>
                      <p>
                        3. Copy the transcription into Word, Google Docs, or your job
                        log. When you need a polished version for a client or change
                        order, use the Clean Text tool to tidy up spelling and
                        contractor shorthand before you send it.
                      </p>
                    </div>
                  </div>

                  {/* Right: upload card */}
                  <div className="bg-secondary/40 rounded-lg border border-border/80 shadow-sm p-4 sm:p-5 lg:p-6">
                    <div className="mb-3">
                      <h2 className="text-lg font-semibold">
                        Upload a site note to get started
                      </h2>
                      <p className="mt-1 text-xs md:text-sm text-muted-foreground">
                        Take a clear photo of a notebook page or site form. We&apos;ll
                        read the handwriting, structure the content, and hand it back
                        in clean text.
                      </p>
                    </div>
                    <DocumentUpload />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Lower content band placeholder for future sections */}
        <section className="bg-secondary/60 border-t border-border/60">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
            <h3 className="text-xl md:text-2xl font-semibold text-slate-900 mb-3">
              Quick rules so your uploads work well
            </h3>
            <p className="max-w-3xl text-sm md:text-base text-muted-foreground leading-relaxed">
              Use dark ink, avoid shadows, and fill the frame with a single notebook
              page or form. If something is critical for billing or scope, underline
              it in your handwriting so it&apos;s easy to spot in the transcription.
              This app is internal to Nautilus Builders—treat it like a scratch pad
              that helps you move field notes into the official job record.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
