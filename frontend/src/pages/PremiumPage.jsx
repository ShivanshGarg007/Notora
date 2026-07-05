import React, { useState } from "react";
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { Crown, Star, Check, Download, Users, BookOpen, Zap, Shield, Headphones } from "lucide-react"
import { trackUserAction } from "../utils/analytics"
import { useAuth } from "@/context/AuthContext"
import { useNavigate } from "react-router-dom"
import { toast } from "react-hot-toast"

const plans = [
  {
    name: "Free",
    price: "₹0",
    period: "forever",
    description: "Perfect for getting started",
    features: [
      "Access to free notes",
      "Basic search functionality",
      "Community chat access",
      "Download up to 10 notes/month",
      "Standard support",
    ],
    buttonText: "Current Plan",
    buttonVariant: "outline",
    popular: false,
  },
  {
    name: "Premium",
    price: "₹199",
    period: "month",
    description: "Unlock your full potential",
    features: [
      "Access to all premium notes",
      "Advanced search & filters",
      "Priority chat support",
      "Unlimited downloads",
      "Offline access",
      "Early access to new content",
      "Ad-free experience",
      "Premium community access",
    ],
    buttonText: "Upgrade Now",
    buttonVariant: "default",
    popular: true,
  },
  {
    name: "Pro",
    price: "₹499",
    period: "month",
    description: "For serious learners",
    features: [
      "Everything in Premium",
      "One-on-one tutoring sessions",
      "Custom note requests",
      "API access for developers",
      "White-label solutions",
      "Priority feature requests",
      "Dedicated account manager",
    ],
    buttonText: "Coming Soon",
    buttonVariant: "outline",
    popular: false,
  },
]

const premiumNotes = [
  {
    id: 1,
    title: "Advanced Java Design Patterns",
    author: "Dr. Sarah Mitchell",
    university: "MIT",
    rating: 4.9,
    downloads: 2500,
    price: "₹100",
    preview:
      "Comprehensive guide to Singleton, Factory, Observer, and Strategy patterns with real-world applications...",
  },
  {
    id: 2,
    title: "C++ Performance Optimization",
    author: "Prof. Alex Chen",
    university: "Stanford",
    rating: 4.8,
    downloads: 1800,
    price: "₹150",
    preview: "Deep dive into memory management, compiler optimizations, and performance profiling techniques...",
  },
  {
    id: 3,
    title: "Full-Stack Web Development Masterclass",
    author: "Emily Rodriguez",
    university: "Berkeley",
    rating: 4.9,
    downloads: 3200,
    price: "₹350",
    preview: "Complete guide covering React, Node.js, databases, deployment, and modern development practices...",
  },
]

const benefits = [
  {
    icon: BookOpen,
    title: "Exclusive Content",
    description: "Access notes from top universities and industry experts",
  },
  {
    icon: Zap,
    title: "Advanced Features",
    description: "Enhanced search, offline access, and priority support",
  },
  {
    icon: Users,
    title: "Premium Community",
    description: "Connect with serious learners and get expert guidance",
  },
  {
    icon: Shield,
    title: "Quality Guarantee",
    description: "All premium content is verified and regularly updated",
  },
]

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

const API_BASE_URL = import.meta.env.VITE_API_URL.replace(/\/$/, '');

const getRazorpayKey = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/payment/razorpay-key`);
    const data = await res.json();
    return data.key;
  } catch {
    return null;
  }
};

export default function PremiumPage() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();

  const handleUpgradeClick = async (plan) => {
    if (!user) {
      toast.error('You are required to login to use this feature');
      navigate('/login');
      return;
    }

    if (user.isPremium) {
      toast.success('You are already a premium user!');
      return;
    }

    if (plan.name === 'Premium') {
      // Razorpay logic here
      const res = await loadRazorpayScript();
      if (!res) {
        toast.error("Failed to load Razorpay. Please try again.");
        return;
      }
      const key = await getRazorpayKey();
      if (!key) {
        toast.error("Unable to fetch payment key. Please try again later.");
        return;
      }
      const options = {
        key,
        amount: 100, // ₹1 in paise
        currency: "INR",
        name: "Notora Premium Upgrade",
        description: "Lifetime Premium Access",
        image: "/faviconNotora.png",
        handler: async function (response) {
          // Call backend to upgrade user
          try {
            const upgradeRes = await fetch(`${API_BASE_URL}/api/auth/update-premium`, {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
                Authorization: user?.token ? `Bearer ${user.token}` : undefined,
              },
              credentials: "include",
              body: JSON.stringify({ userId: user._id, isPremium: true })
            });
            if (upgradeRes.ok) {
              const data = await upgradeRes.json();
              // Update user context and localStorage
              const updatedUser = {
                ...user,
                isPremium: true
              };
              setUser(updatedUser);
              localStorage.setItem('user', JSON.stringify(updatedUser));
              toast.success("You are now a premium user!");
              navigate('/');
            } else {
              toast.error("Upgrade failed. Please contact support.");
            }
          } catch (err) {
            toast.error("Upgrade failed. Please try again.");
          }
        },
        prefill: {
          name: user?.name || "",
          email: user?.email || "",
        },
        theme: {
          color: "#3399cc",
        },
        modal: {
          ondismiss: function () {
            toast("Payment cancelled.");
          },
        },
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    } else if (plan.name === 'Pro') {
      toast.info('Pro plan coming soon!');
    }
  };

  const handlePremiumContentClick = (contentType) => {
    if (!user?.isPremium) {
      toast.error('You are required to login to use this feature');
      navigate('/login');
      return;
    }
    trackUserAction.viewPremiumContent(contentType);
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-16">
      {/* Hero Section */}
      <section className="text-center space-y-8 py-12 animate-fade-in-down">
        <div className="space-y-4">
          <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-4 py-2 animate-bounce-subtle border border-[#e2e8f0]">
            <Crown className="w-4 h-4 mr-2" />
            Premium Access
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight animate-fade-in-up">
            Unlock <span className="text-[#bbd9e8]">Premium</span> Content
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed animate-fade-in-up animation-delay-200">
            Get access to exclusive notes from top universities, expert-curated content, and advanced learning tools to
            accelerate your academic success.
          </p>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {benefits.map((benefit, index) => {
          const Icon = benefit.icon
          return (
            <Card 
              key={index} 
              className="text-center hover:shadow-lg transition-all duration-300 hover:scale-105 animate-fade-in-up border border-[#e2e8f0]"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-gradient-to-br from-[#bbd9e8] to-[#a8c8d8] rounded-lg flex items-center justify-center mx-auto mb-4 animate-pulse-subtle border border-[#e2e8f0]">
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold mb-2">{benefit.title}</h3>
                <p className="text-sm text-muted-foreground">{benefit.description}</p>
              </CardContent>
            </Card>
          )
        })}
      </section>

      {/* Pricing Plans */}
      <section className="space-y-8 animate-fade-in-up animation-delay-300">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold">Choose Your Plan</h2>
          <p className="text-muted-foreground">Select the perfect plan for your learning journey</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <Card 
              key={index} 
              className={`relative hover:shadow-lg transition-all duration-300 hover:scale-105 animate-fade-in-up border border-[#e2e8f0] ${
                plan.popular ? "border-[#bbd9e8] shadow-lg" : ""
              }`}
              style={{ animationDelay: `${index * 150}ms` }}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 animate-bounce-subtle">
                  <Badge className="bg-gradient-to-r from-[#bbd9e8] to-[#a8c8d8] text-white px-4 py-1 border border-[#e2e8f0]">
                    Most Popular
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <div className="space-y-2">
                  <div className="text-3xl font-bold">
                    {plan.price}
                    <span className="text-lg font-normal text-muted-foreground">/{plan.period}</span>
                  </div>
                  <CardDescription>{plan.description}</CardDescription>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                <ul className="space-y-3">
                  {plan.features.map((feature, featureIndex) => (
                    <li 
                      key={featureIndex} 
                      className="flex items-start space-x-3 animate-fade-in-right"
                      style={{ animationDelay: `${featureIndex * 50}ms` }}
                    >
                      <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  variant={plan.buttonVariant}
                  className={`w-full transition-all duration-300 border border-[#e2e8f0] ${
                    plan.popular && !(plan.name === 'Premium' && user?.isPremium)
                      ? "bg-[#bbd9e8] hover:bg-[#a8c8d8] text-white"
                      : ""
                  } ${
                    plan.name === 'Premium' && user?.isPremium
                      ? "bg-gray-300 text-gray-600 cursor-not-allowed font-semibold"
                      : ""
                  }`}
                  onClick={() => handleUpgradeClick(plan)}
                  disabled={plan.name === 'Premium' && user?.isPremium}
                >
                  {plan.name === 'Premium' && user?.isPremium ? "You are already Premium" : plan.buttonText}
                </Button>
                {plan.name === 'Premium' && !user?.isPremium && (
                  <div className="mt-2 text-xs text-blue-600 bg-blue-50 border border-blue-200 rounded px-2 py-1">
                    <strong>Test Mode:</strong> Use dummy card details (e.g., 4111 1111 1111 1111), any future expiry, any CVV, and any OTP to complete the payment. No real money will be deducted.
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Premium Notes Preview */}
      <section className="space-y-8 animate-fade-in-up animation-delay-400">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold">Featured Premium Content</h2>
          <p className="text-muted-foreground">Get a taste of our exclusive premium notes</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {premiumNotes.map((note, index) => (
            <Card 
              key={note.id} 
              className="hover:shadow-lg transition-all duration-300 hover:scale-105 group relative overflow-hidden animate-fade-in-up border border-[#e2e8f0]"
              style={{ animationDelay: `${index * 150}ms` }}
            >
              <div className="absolute top-4 right-4 z-10 animate-pulse-subtle">
                <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border border-[#e2e8f0]">
                  <Crown className="w-3 h-3 mr-1" />
                  Premium
                </Badge>
              </div>

              <CardHeader className="pb-3">
                <CardTitle className="text-lg leading-tight group-hover:text-[#bbd9e8] transition-colors pr-16">
                  {note.title}
                </CardTitle>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div>by {note.author}</div>
                  <div>{note.university}</div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground line-clamp-3">{note.preview}</p>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                      <Star className="w-4 h-4 mr-1 fill-yellow-400 text-yellow-400 animate-pulse-subtle" />
                      <span className="font-medium">{note.rating}</span>
                    </div>
                    <div className="flex items-center text-muted-foreground">
                      <Download className="w-4 h-4 mr-1" />
                      {note.downloads.toLocaleString()}
                    </div>
                  </div>
                  <div className="font-bold text-[#bbd9e8]">{note.price}</div>
                </div>

                <Button 
                  className={`w-full bg-gradient-to-r from-[#bbd9e8] to-[#a8c8d8] hover:from-[#a8c8d8] hover:to-[#bbd9e8] text-white transition-all duration-300 hover:scale-105 border border-[#e2e8f0] ${user?.isPremium ? 'bg-gray-300 text-gray-600 cursor-not-allowed font-semibold' : ''}`}
                  onClick={() => trackUserAction.viewPremiumContent('note')}
                  disabled={user?.isPremium}
                >
                  <Crown className="w-4 h-4 mr-2" />
                  {user?.isPremium ? 'You are already Premium' : 'Get Premium Access'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="text-center space-y-8 py-12 bg-gradient-to-r from-[#bbd9e8]/10 via-[#bbd9e8]/5 to-transparent rounded-2xl animate-fade-in-up animation-delay-500 border border-[#e2e8f0]">
        <div className="space-y-4">
          <h2 className="text-3xl font-bold">Ready to Go Premium?</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Join thousands of students who have accelerated their learning with premium content
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            size="lg" 
            className="bg-[#bbd9e8] hover:bg-[#a8c8d8] text-white transition-all duration-300 hover:scale-105 animate-pulse-subtle border border-[#e2e8f0]"
            onClick={() => trackUserAction.upgradeToPremium('premium')}
          >
            <Crown className="w-5 h-5 mr-2" />
            Start Premium Trial
          </Button>
          <Button 
            size="lg" 
            variant="outline"
            className="transition-all duration-300 hover:scale-105 border border-[#e2e8f0]"
          >
            <Headphones className="w-5 h-5 mr-2" />
            Contact Support
          </Button>
        </div>
      </section>
    </div>
  )
} 