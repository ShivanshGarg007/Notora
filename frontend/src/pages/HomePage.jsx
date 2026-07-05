import React from "react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { BookOpen, Users, Download, Upload, Sparkles, TrendingUp, Calendar, Bell, Crown } from "lucide-react";
import { Link } from "react-router-dom";

const features = [
  {
    icon: Upload,
    title: "Upload Notes",
    description: "Share your lecture notes with the community and help others learn.",
  },
  {
    icon: Download,
    title: "Download Resources",
    description: "Access thousands of high-quality notes from top students.",
  },
  {
    icon: Users,
    title: "Peer Chat",
    description: "Connect with classmates and discuss complex topics in real-time.",
  },
  {
    icon: Sparkles,
    title: "Premium Content",
    description: "Get access to exclusive notes and advanced study materials.",
  },
];

const announcements = [
  {
    title: "New Java Advanced Concepts Notes Available",
    date: "2025-05-15",
    type: "New Content",
    description: "Comprehensive notes on multithreading, collections, and design patterns.",
  },
  {
    title: "Premium Section Launch",
    date: "2025-06-11",
    type: "Feature",
    description: "Access exclusive content from industry experts and top universities.",
  },
  {
    title: "Mobile App Coming Soon",
    date: "2025-03-5",
    type: "Update",
    description: "Study on the go with our upcoming mobile application.",
  },
];

const stats = [
  { label: "Active Users", value: "50+", icon: Users },
  { label: "Notes Shared", value: "200+", icon: BookOpen },
  { label: "Downloads", value: "1000+", icon: Download },
  { label: "Success Rate", value: "95%", icon: TrendingUp },
];

export default function HomePage() {
  return (
    <div className="space-y-16 px-6 md:px-12 lg:px-24">
      {/* Hero Section */}
      <section className="text-center space-y-8 py-12 animate-fade-in-down">
        <div className="space-y-4">
          <Badge className="px-4 py-2 text-sm font-semibold bg-[#f4f7fa] text-black rounded-full shadow border-0 mx-auto mb-2" style={{ boxShadow: '0 2px 8px 0 rgba(154, 201, 222, 0.10)' }}>
            <Sparkles className="w-4 h-4 mr-2 text-[#9AC9DE]" />
            Simplified Learning Experience
          </Badge>

          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            Welcome to <span className="bg-gradient-to-r from-[#7bbad2] via-[#9AC9DE] to-[#5fa6c7] bg-clip-text text-transparent">Notora</span>
          </h1>
          <p className="text-xl text-[#64748b] max-w-2xl mx-auto leading-relaxed">
            Your ultimate platform for organizing, sharing, and accessing lecture notes. Master Java, C++, Web
            Development, and more with our community-driven approach.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link to="/notes">
            <Button size="lg" className="bg-[#9AC9DE] text-white shadow-lg hover:bg-[#7bbad2] transition-all duration-300">
              <BookOpen className="w-5 h-5 mr-2" />
              Explore Notes
            </Button>
          </Link>
          <Link to="/premium">
            <Button
              size="lg"
              variant="outline"
              className="border border-[#9AC9DE] text-[#3a5d74] bg-transparent hover:bg-[#eaf6fb] hover:text-[#3a5d74] shadow-lg transition-all duration-300"
            >
              <Crown className="w-5 h-5 mr-2" />
              Go Premium
            </Button>
          </Link>
        </div>
      </section>

      {/* Stats Section */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="text-center border border-[#e2e8f0] glass-effect bg-gradient-to-br from-[#fafdff] to-[#eaf6fb] shadow-md animate-fade-in-down hover:scale-105 hover:shadow-2xl transition-all duration-300">
              <CardContent className="pt-6">
                <div className="flex justify-center mb-2">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: '#f5f9fc' }}>
                    <Icon className="w-6 h-6 text-[#5fa6c7]" />
                  </div>
                </div>
                <div className="text-2xl md:text-3xl font-bold text-black">{stat.value}</div>
                <div className="text-sm text-[#64748b]">{stat.label}</div>
              </CardContent>
            </Card>
          );
        })}
      </section>

      {/* Features Section */}
      <section className="space-y-8">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold text-black">Why Choose Notora?</h2>
          <p className="text-[#64748b] max-w-2xl mx-auto">
            Discover the features that make learning and sharing knowledge effortless
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="transition-all duration-300 group border border-[#e2e8f0] glass-effect bg-gradient-to-br from-[#fafdff] to-[#eaf6fb] shadow-md animate-fade-in-down hover:scale-105 hover:shadow-2xl">
                <CardHeader className="text-center">
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4 bg-[#9AC9DE] bg-opacity-60 group-hover:scale-110 transition-transform duration-300"
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-lg md:text-xl font-semibold text-black">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center text-black">{feature.description}</CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Announcements Section */}
      <section className="space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-black">Recent Announcements</h2>
            <p className="text-black">Stay updated with the latest news and features</p>
          </div>
          <Bell className="w-6 h-6 text-[#9AC9DE]" />
        </div>

        <div className="grid gap-6">
          {announcements.map((announcement, index) => (
            <Card key={index} className="border border-[#e2e8f0] glass-effect bg-gradient-to-br from-[#fafdff] to-[#eaf6fb] shadow-md animate-fade-in-down hover:scale-105 hover:shadow-2xl transition-all duration-300">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-[#9AC9DE] bg-opacity-30 text-[#3a5d74] rounded-full px-3 py-0.5 font-semibold border-0">
                        {announcement.type}
                      </Badge>
                      <div className="flex items-center text-sm text-[#64748b]">
                        <Calendar className="w-4 h-4 mr-1" />
                        {new Date(announcement.date).toLocaleDateString()}
                      </div>
                    </div>
                    <CardTitle className="text-xl text-black">{announcement.title}</CardTitle>
                    <CardDescription className="text-base text-black">
                      {announcement.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section
        className="text-center space-y-8 py-12 rounded-2xl animate-fade-in-down"
        style={{ background: "linear-gradient(90deg, #eaf6fb 0%, #fafdff 100%)" }}
      >
        <div className="space-y-4">
          <h2 className="text-3xl font-bold text-[#3a5d74]">Ready to Start Learning?</h2>
          <p className="text-[#64748b] max-w-xl mx-auto">
            Join thousands of students who are already using Notora to excel in their studies
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/notes">
            <Button size="lg" className="text-white bg-[#9AC9DE] hover:bg-[#7bbad2] transition-all duration-300">
              Browse Notes
            </Button>
          </Link>
          <Link to="/upload">
            <Button
              size="lg"
              variant="outline"
              className="border border-[#9AC9DE] text-[#3a5d74] bg-transparent hover:bg-[#eaf6fb] hover:text-[#3a5d74] transition-all duration-300"
            >
              Upload Your Notes
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
