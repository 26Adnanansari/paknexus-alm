'use client';

import React from 'react';
import Navbar from '@/components/layout/Navbar';
import { useBranding } from '@/context/branding-context';
import { motion } from 'framer-motion';
import {
  Users, BookOpen, UserCheck, ArrowRight, ShieldCheck, Zap, Globe,
  Check, Star, ChevronDown, DollarSign, CreditCard, Calendar,
  BarChart, FileText, Smartphone, Mail, Phone, MapPin
} from 'lucide-react';
import SignupForm from '@/components/SignupForm';

export default function Home() {
  const { branding } = useBranding();
  const [isSignupOpen, setIsSignupOpen] = React.useState(false);
  const [billingCycle, setBillingCycle] = React.useState<'monthly' | 'yearly'>('monthly');
  const [expandedFaq, setExpandedFaq] = React.useState<number | null>(null);

  const features = [
    {
      icon: Users,
      title: "Student Management",
      desc: "Complete digital records, attendance tracking, and performance analytics.",
      color: "text-blue-600",
      bg: "bg-blue-50"
    },
    {
      icon: DollarSign,
      title: "Fee Collection",
      desc: "Automated fee management, payment tracking, and financial reporting.",
      color: "text-green-600",
      bg: "bg-green-50"
    },
    {
      icon: CreditCard,
      title: "ID Card Generation",
      desc: "Professional ID cards with QR codes, bulk generation, and templates.",
      color: "text-purple-600",
      bg: "bg-purple-50"
    },
    {
      icon: Calendar,
      title: "Attendance System",
      desc: "QR code scanning, face recognition, and real-time attendance tracking.",
      color: "text-orange-600",
      bg: "bg-orange-50"
    },
    {
      icon: UserCheck,
      title: "Staff Management",
      desc: "Efficient staff attendance, payroll, and class assignment management.",
      color: "text-indigo-600",
      bg: "bg-indigo-50"
    },
    {
      icon: BookOpen,
      title: "Academic Content",
      desc: "Distribute learning materials, assignments, and digital resources.",
      color: "text-violet-600",
      bg: "bg-violet-50"
    },
    {
      icon: BarChart,
      title: "Analytics & Reports",
      desc: "Real-time insights, performance metrics, and comprehensive reporting.",
      color: "text-pink-600",
      bg: "bg-pink-50"
    },
    {
      icon: FileText,
      title: "Online Admissions",
      desc: "Streamlined admission process with online forms and document management.",
      color: "text-cyan-600",
      bg: "bg-cyan-50"
    }
  ];

  const pricingPlans = [
    {
      name: "Starter",
      price: { monthly: 4999, yearly: 49990 },
      description: "Perfect for small schools",
      features: [
        "Up to 200 students",
        "Core features included",
        "Email support",
        "5GB storage",
        "Basic reporting",
        "Mobile app access"
      ],
      popular: false,
      cta: "Start Free Trial"
    },
    {
      name: "Professional",
      price: { monthly: 9999, yearly: 99990 },
      description: "Most popular choice",
      features: [
        "Up to 1000 students",
        "All features included",
        "Priority support",
        "50GB storage",
        "Advanced analytics",
        "Custom branding",
        "API access",
        "Bulk operations"
      ],
      popular: true,
      cta: "Start Free Trial"
    },
    {
      name: "Enterprise",
      price: { monthly: 0, yearly: 0 },
      description: "For large institutions",
      features: [
        "Unlimited students",
        "White-label solution",
        "Dedicated support",
        "Unlimited storage",
        "Custom integrations",
        "Advanced security",
        "SLA guarantee",
        "Training included"
      ],
      popular: false,
      cta: "Contact Sales"
    }
  ];

  const testimonials = [
    {
      name: "Dr. Ahmed Khan",
      role: "Principal",
      school: "Green Valley School",
      rating: 5,
      text: "PakNexus ALM transformed our school management. The fee collection system alone saved us 20 hours per month!",
      avatar: "👨‍🏫"
    },
    {
      name: "Fatima Malik",
      role: "Administrator",
      school: "Bright Future Academy",
      rating: 5,
      text: "The attendance system with QR codes is brilliant. Parents love getting real-time notifications!",
      avatar: "👩‍💼"
    },
    {
      name: "Imran Siddiqui",
      role: "School Owner",
      school: "Elite International School",
      rating: 5,
      text: "Best investment we made. The ID card generation and student management features are top-notch.",
      avatar: "👨‍💻"
    }
  ];

  const faqs = [
    {
      question: "How does the free trial work?",
      answer: "You get full access to all features for 14 days, no credit card required. You can import your data, test all features, and decide if it's right for your school."
    },
    {
      question: "Can I import existing student data?",
      answer: "Yes! We support CSV/Excel imports and provide a migration assistant. Our team can help you migrate data from your existing system at no extra cost."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept all major credit/debit cards, bank transfers, and popular payment methods like JazzCash and EasyPaisa for Pakistani schools."
    },
    {
      question: "Is my data secure?",
      answer: "Absolutely. We use enterprise-grade encryption, isolated database schemas per school, and regular backups. Your data is stored in secure data centers with 99.9% uptime."
    },
    {
      question: "Do you offer training?",
      answer: "Yes! We provide comprehensive onboarding, video tutorials, and live training sessions. Our support team is available 24/7 to help you."
    },
    {
      question: "Can I customize the system?",
      answer: "Yes! You can upload your school logo, set custom colors, configure fee structures, and customize ID card templates. Enterprise plans include white-labeling."
    }
  ];

  return (
    <div className="min-h-screen bg-background selection:bg-primary/20">
      <Navbar />

      <main className="pt-20 pb-8 px-4 md:px-6">
        {/* Enhanced Hero Section */}
        <section className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-8 md:gap-16 items-center pt-8 mb-12 md:pt-24 md:mb-40">
          <motion.div
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-primary/10 rounded-full text-primary text-xs md:text-sm font-bold mb-4 md:mb-6">
              <Zap className="h-3 w-3 md:h-4 md:w-4" />
              <span>Powered by AI Technology</span>
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-4 md:mb-8 leading-tight">
              Effortless School Management for <span className="gradient-text">Modern Educators</span>
            </h1>
            <p className="text-base md:text-xl text-muted-foreground mb-6 md:mb-8 max-w-xl leading-relaxed">
              All-in-one platform to manage students, staff, fees, and academics. Join 500+ schools already using <strong>{branding?.name || 'PakNexus ALM'}</strong>.
            </p>

            {/* Trust Indicators */}
            <div className="flex flex-wrap gap-4 mb-6 md:mb-8">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="h-4 w-4 text-green-600" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="h-4 w-4 text-green-600" />
                <span>14-day free trial</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="h-4 w-4 text-green-600" />
                <span>Setup in 5 minutes</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
              <button
                onClick={() => setIsSignupOpen(true)}
                className="px-6 py-3 md:px-8 md:py-4 bg-primary text-primary-foreground rounded-xl md:rounded-2xl font-bold premium-shadow hover:scale-105 transition-all flex items-center justify-center space-x-2 w-full sm:w-auto text-sm md:text-base"
              >
                <span>Start Free Trial</span>
                <ArrowRight className="h-4 w-4 md:h-5 md:w-5" />
              </button>
              <button
                onClick={() => window.location.href = '/login'}
                className="px-6 py-3 md:px-8 md:py-4 bg-white dark:bg-slate-800 border-2 border-border rounded-xl md:rounded-2xl font-bold hover:bg-muted transition-all w-full sm:w-auto text-sm md:text-base"
              >
                Sign In
              </button>
            </div>
          </motion.div>

          {/* Signup Modal */}
          {isSignupOpen && (
            <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                onClick={() => setIsSignupOpen(false)}
              />
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="relative z-10 bg-white rounded-[24px] md:rounded-[32px] shadow-2xl w-full max-w-lg p-5 md:p-8 overflow-y-auto max-h-[90vh]"
              >
                <button
                  onClick={() => setIsSignupOpen(false)}
                  className="absolute top-4 right-4 md:top-6 md:right-6 p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                </button>
                <SignupForm onClose={() => setIsSignupOpen(false)} />
              </motion.div>
            </div>
          )}

          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="relative mt-8 lg:mt-0"
          >
            {/* Decorative Blob */}
            <div className="absolute -top-10 -left-10 md:-top-20 md:-left-20 w-48 h-48 md:w-64 md:h-64 bg-primary/20 rounded-full blur-3xl animate-pulse" />
            <div className="absolute -bottom-10 -right-10 md:-bottom-20 md:-right-20 w-48 h-48 md:w-64 md:h-64 bg-indigo-400/20 rounded-full blur-3xl animate-pulse delay-700" />

            <div className="glass rounded-[1.5rem] md:rounded-[2rem] p-6 md:p-8 relative overflow-hidden aspect-square flex flex-col items-center justify-center text-center">
              <div className="bg-primary/5 p-4 md:p-8 rounded-full mb-4 md:mb-8">
                {branding?.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={branding.logo_url} alt="Logo" className="w-24 md:w-48 h-auto" />
                ) : (
                  <Globe className="w-16 h-16 md:w-32 md:h-32 text-primary animate-spin-slow" />
                )}
              </div>
              <h2 className="text-xl md:text-3xl font-bold mb-2 md:mb-4">{branding?.name || 'PakNexus ALM'}</h2>
              <p className="text-muted-foreground max-w-xs text-sm md:text-base">{branding?.website || 'School Management System'}</p>
            </div>
          </motion.div>
        </section>

        {/* Stats Section */}
        <section className="max-w-7xl mx-auto mb-12 md:mb-32">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
            {[
              { label: "Schools Trust Us", value: "500+", icon: Users },
              { label: "Students Managed", value: "50K+", icon: Users },
              { label: "Satisfaction Rate", value: "98%", icon: Star },
              { label: "Support", value: "24/7", icon: ShieldCheck }
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ y: 20, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass p-6 rounded-2xl text-center"
              >
                <stat.icon className="h-8 w-8 text-primary mx-auto mb-3" />
                <div className="text-3xl md:text-4xl font-black text-foreground mb-2">{stat.value}</div>
                <div className="text-sm text-muted-foreground font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Features Grid */}
        <section className="max-w-7xl mx-auto mb-12 md:mb-32">
          <div className="text-center mb-8 md:mb-16">
            <h2 className="text-3xl md:text-5xl font-black mb-4 md:mb-6 tracking-tight">Everything You Need</h2>
            <p className="text-base md:text-xl text-muted-foreground px-4 max-w-2xl mx-auto">Powerful features to manage your institution efficiently, all in one place.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ y: 20, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="glass p-6 rounded-2xl hover:shadow-lg transition-all group cursor-pointer"
              >
                <div className={`${feature.bg} ${feature.color} p-3 rounded-xl w-fit mb-4 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="max-w-7xl mx-auto mb-12 md:mb-32">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-3xl md:text-5xl font-black mb-4 md:mb-6 tracking-tight">Simple, Transparent Pricing</h2>
            <p className="text-base md:text-xl text-muted-foreground px-4 max-w-2xl mx-auto mb-8">Choose the plan that fits your school's needs</p>

            {/* Billing Toggle */}
            <div className="inline-flex items-center gap-3 bg-slate-100 dark:bg-slate-800 p-1 rounded-full">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-6 py-2 rounded-full font-bold text-sm transition-all ${billingCycle === 'monthly' ? 'bg-white dark:bg-slate-700 shadow-md' : 'text-muted-foreground'
                  }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-6 py-2 rounded-full font-bold text-sm transition-all ${billingCycle === 'yearly' ? 'bg-white dark:bg-slate-700 shadow-md' : 'text-muted-foreground'
                  }`}
              >
                Yearly <span className="text-green-600 ml-1">Save 17%</span>
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6 md:gap-8">
            {pricingPlans.map((plan, i) => (
              <motion.div
                key={i}
                initial={{ y: 20, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`glass p-8 rounded-3xl relative ${plan.popular ? 'ring-2 ring-primary shadow-2xl scale-105' : ''
                  }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-indigo-600 text-white px-4 py-1 rounded-full text-sm font-bold">
                    Most Popular
                  </div>
                )}
                <h3 className="text-2xl font-black mb-2">{plan.name}</h3>
                <p className="text-sm text-muted-foreground mb-6">{plan.description}</p>
                <div className="mb-6">
                  {plan.price[billingCycle] === 0 ? (
                    <div className="text-4xl font-black">Custom</div>
                  ) : (
                    <>
                      <div className="text-4xl font-black">
                        PKR {plan.price[billingCycle].toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        per {billingCycle === 'monthly' ? 'month' : 'year'}
                      </div>
                    </>
                  )}
                </div>
                <button
                  onClick={() => plan.cta === 'Contact Sales' ? null : setIsSignupOpen(true)}
                  className={`w-full py-3 rounded-xl font-bold mb-6 transition-all ${plan.popular
                      ? 'bg-primary text-primary-foreground hover:scale-105 shadow-lg'
                      : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                >
                  {plan.cta}
                </button>
                <ul className="space-y-3">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-start gap-3 text-sm">
                      <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="max-w-7xl mx-auto mb-12 md:mb-32">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-3xl md:text-5xl font-black mb-4 md:mb-6 tracking-tight">Loved by Educators</h2>
            <p className="text-base md:text-xl text-muted-foreground px-4 max-w-2xl mx-auto">See what school administrators say about us</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, i) => (
              <motion.div
                key={i}
                initial={{ y: 20, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass p-6 rounded-2xl"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, j) => (
                    <Star key={j} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-muted-foreground italic mb-6 leading-relaxed">"{testimonial.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="text-4xl">{testimonial.avatar}</div>
                  <div>
                    <div className="font-bold">{testimonial.name}</div>
                    <div className="text-sm text-muted-foreground">{testimonial.role}, {testimonial.school}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* FAQ Section */}
        <section className="max-w-3xl mx-auto mb-12 md:mb-32">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-3xl md:text-5xl font-black mb-4 md:mb-6 tracking-tight">Frequently Asked Questions</h2>
            <p className="text-base md:text-xl text-muted-foreground px-4">Everything you need to know about PakNexus ALM</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ y: 20, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="glass rounded-2xl overflow-hidden"
              >
                <button
                  onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                  className="w-full p-6 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <span className="font-bold text-lg pr-4">{faq.question}</span>
                  <ChevronDown
                    className={`h-5 w-5 flex-shrink-0 transition-transform ${expandedFaq === i ? 'rotate-180' : ''
                      }`}
                  />
                </button>
                {expandedFaq === i && (
                  <div className="px-6 pb-6 text-muted-foreground leading-relaxed">
                    {faq.answer}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="max-w-5xl mx-auto mb-12 md:mb-32">
          <div className="bg-gradient-to-br from-primary via-indigo-600 to-purple-600 text-white rounded-[2rem] md:rounded-[3rem] p-8 md:p-16 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -ml-32 -mb-32" />

            <div className="relative z-10">
              <h2 className="text-3xl md:text-5xl font-black mb-4 md:mb-6">Ready to Transform Your School?</h2>
              <p className="text-lg md:text-xl text-white/90 mb-8 md:mb-10 max-w-2xl mx-auto">
                Join 500+ schools already using PakNexus ALM. Start your free 14-day trial today.
              </p>
              <button
                onClick={() => setIsSignupOpen(true)}
                className="px-8 py-4 md:px-12 md:py-5 bg-white text-slate-900 rounded-xl md:rounded-2xl font-black text-base md:text-lg hover:scale-105 transition-all shadow-2xl inline-flex items-center gap-3"
              >
                Start Free Trial <ArrowRight className="h-5 w-5" />
              </button>
              <p className="text-sm text-white/80 mt-4">No credit card required • Setup in 5 minutes</p>
            </div>
          </div>
        </section>

        {/* Trust Banner */}
        <section className="max-w-5xl mx-auto bg-slate-900 text-white rounded-[2rem] md:rounded-[3rem] p-6 md:p-12 overflow-hidden relative mb-12">
          <div className="absolute top-0 right-0 w-32 h-32 md:w-64 md:h-64 bg-primary/30 rounded-full blur-3xl -mr-16 -mt-16 md:-mr-32 md:-mt-32" />

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8 text-center md:text-left">
            <div>
              <div className="flex items-center justify-center md:justify-start space-x-2 text-indigo-400 font-bold mb-3 md:mb-4 text-sm md:text-base">
                <ShieldCheck className="h-4 w-4 md:h-5 md:w-5" />
                <span>Enterprise-Grade Security</span>
              </div>
              <h2 className="text-2xl md:text-4xl font-extrabold mb-3 md:mb-4">Your Data, Protected.</h2>
              <p className="text-slate-400 max-w-sm text-sm md:text-base mx-auto md:mx-0">Bank-level encryption, isolated databases, and 99.9% uptime guarantee.</p>
            </div>
            <button className="px-6 py-4 md:px-10 md:py-5 bg-white text-slate-900 rounded-xl md:rounded-2xl font-black text-sm md:text-lg hover:scale-105 transition-all shadow-2xl w-full md:w-auto">
              View Security Details
            </button>
          </div>
        </section>
      </main>

      {/* Enhanced Footer */}
      <footer className="max-w-7xl mx-auto px-6 py-12 border-t border-border">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="h-8 w-8 bg-primary rounded-lg" />
              <span className="font-bold text-lg">PakNexus ALM</span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Modern school management system for the digital age.
            </p>
            <div className="flex gap-3">
              {/* Social icons placeholder */}
            </div>
          </div>

          <div>
            <h3 className="font-bold mb-4">Product</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#features" className="hover:text-primary transition-colors">Features</a></li>
              <li><a href="#pricing" className="hover:text-primary transition-colors">Pricing</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Updates</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Roadmap</a></li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold mb-4">Company</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Blog</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Contact</a></li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold mb-4">Legal</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Cookie Policy</a></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>© 2026 PakNexus ALM. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Mail className="h-4 w-4" />
            <span>support@paknexus.com</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
