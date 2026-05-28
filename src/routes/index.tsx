import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: HomeComponent,
})

function HomeComponent() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Talentra Tz
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Connecting Talent with Opportunity in Tanzania
          </p>
          <div className="flex justify-center gap-4">
            <a 
              href="/jobs" 
              className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition"
            >
              Find Jobs
            </a>
            <a 
              href="/post-job" 
              className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition"
            >
              Post a Job
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
