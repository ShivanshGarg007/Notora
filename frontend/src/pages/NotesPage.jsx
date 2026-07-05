import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/Card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/Badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Search,
    Download,
    Calendar,
    User,
    Filter,
    Upload,
    Star,
    Eye,
    ArrowUp,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { trackUserAction } from "../utils/analytics";

const subjects = ["All", "Java", "C++", "Web Development", "Python", "Data Structures", "Algorithms"];

export default function NotesPage() {
    const { api, user, token } = useAuth();
    const [notes, setNotes] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedSubject, setSelectedSubject] = useState("All");
    const [sortBy, setSortBy] = useState("date");
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const [showScroll, setShowScroll] = useState(false);

    useEffect(() => {
        console.log('NotesPage - Auth state:', {
            hasUser: !!user,
            hasToken: !!token,
            userPreview: user ? { 
                id: user._id, 
                name: user.name, 
                role: user.role,
                isPremium: user.isPremium,
                fullUserObject: user  // Log the entire user object
            } : null
        });

        const fetchNotes = async () => {
            try {
                console.log('Fetching notes with token:', token ? 'Present' : 'Missing');
                // Use api if available, otherwise fallback to fetch
                let response;
                if (api) {
                    response = await api.get('/api/notes');
                } else {
                    response = await fetch(`${import.meta.env.VITE_API_URL}/api/notes`);
                    response = { data: await response.json() };
                }
                console.log('Notes fetched successfully:', response.data.length);
                setNotes(Array.isArray(response.data) ? response.data : response.data.notes || []);
                setError(null);
            } catch (err) {
                console.error("Error fetching notes:", err);
                setError("Failed to fetch notes. Please try again later.");
            } finally {
                setLoading(false);
            }
        };

        fetchNotes();
    }, [api, user, token]);

    useEffect(() => {
        const handleScroll = () => {
            setShowScroll(window.scrollY > 200);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const filteredNotes = notes
        .filter(
            (note) =>
                note.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
                (selectedSubject === "All" ||
                    note.subject.toLowerCase() === selectedSubject.toLowerCase())
        )
        .sort((a, b) => {
            switch (sortBy) {
                case "downloads":
                    return (b.downloads || 0) - (a.downloads || 0);
                case "rating":
                    return (b.rating || 0) - (a.rating || 0);
                case "date":
                default:
                    return (
                        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                    );
            }
        });

    const handleDownload = (note) => {
        if (note.isPremium && !user?.isPremium) {
            // Track attempt to download premium content
            trackUserAction.viewPremiumContent('note');
            navigate('/premium');
            return;
        }
        // Track successful download
        trackUserAction.downloadNote(note._id, note.title, note.subject);
        window.open(note.fileUrl, '_blank');
    };

    return (
        <>
        <div className="space-y-8 px-6 md:px-12 lg:px-24 pt-8 pb-16">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-black gradient-text">
                        Lecture Notes
                    </h1>
                    <p className="text-[#64748b]">
                        Discover and download high-quality study materials
                    </p>
                </div>
                <div className="w-full md:w-auto flex flex-col items-end">
                    {user ? (
                        <Link to="/upload">
                            <Button
                                style={{ backgroundColor: "#9AC9DE" }}
                                className="text-primary-foreground hover:opacity-80"
                            >
                                <Upload className="w-4 h-4 mr-2" />
                                Upload Notes
                            </Button>
                        </Link>
                    ) : (
                        <div className="flex flex-col items-end">
                            <button
                                className="flex items-center bg-gray-300 text-gray-500 py-2 px-4 rounded-lg font-medium cursor-not-allowed mb-1"
                                title="You are required to login to use this feature"
                                disabled
                            >
                                <Upload className="w-4 h-4 mr-2" />
                                Upload Notes
                            </button>
                            <span className="text-sm text-gray-500 ml-1">You need to create an account before uploading notes.</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Search and Filters Container */}
            <Card className="glass-effect border border-[#e2e8f0] bg-white shadow-sm">
                <CardContent className="pt-6 rounded-md">
                    <div className="flex flex-col md:flex-row gap-4">

                        {/* Search Input */}
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#64748b] w-4 h-4" />
                            <Input
                                placeholder="Search notes..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 bg-white border-[#5375a2] text-black placeholder-[#64748b] focus:outline-none focus:ring-2 focus:ring-[#85cbe5] focus:border-[#85cbe5] transition"
                            />
                        </div>

                        {/* Subject Filter */}
                        <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                            <SelectTrigger className="w-full md:w-48 bg-white border border-[#e2e8f0] text-[#64748b] focus:ring-2 focus:ring-[#85cbe5] focus:border-[#85cbe5] transition">
                                <Filter className="w-4 h-4 mr-2 text-[#64748b]" />
                                <SelectValue placeholder="Subject" />
                            </SelectTrigger>
                            <SelectContent className="bg-white border border-[#e2e8f0] shadow-md">
                                {subjects.map((subject) => (
                                    <SelectItem
                                        key={subject}
                                        value={subject}
                                        className="hover:bg-[#f1f5f9] hover:text-black transition-colors cursor-pointer text-[#64748b]"
                                    >
                                        {subject}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Sort Dropdown */}
                        <Select value={sortBy} onValueChange={setSortBy}>
                            <SelectTrigger className="w-full md:w-48 bg-white border border-[#e2e8f0] text-black focus:ring-2 focus:ring-[#85cbe5] focus:border-[#85cbe5] transition">
                                <SelectValue placeholder="Sort by" />
                            </SelectTrigger>
                            <SelectContent className="bg-white border border-[#e2e8f0] shadow-md">
                                <SelectItem
                                    value="date"
                                    className="hover:bg-[#f1f5f9] hover:text-black transition-colors cursor-pointer text-[#64748b]"
                                >
                                    Latest
                                </SelectItem>
                                <SelectItem
                                    value="downloads"
                                    className="hover:bg-[#f1f5f9] hover:text-black transition-colors cursor-pointer text-[#64748b]"
                                >
                                    Most Downloaded
                                </SelectItem>
                                <SelectItem
                                    value="rating"
                                    className="hover:bg-[#f1f5f9] hover:text-black transition-colors cursor-pointer text-[#64748b]"
                                >
                                    Highest Rated
                                </SelectItem>
                            </SelectContent>
                        </Select>

                    </div>
                </CardContent>
            </Card>

            {/* Notes Grid */}
            <section className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredNotes.map((note, idx) => (
                    <Card
                        key={note._id}
                        className="group relative overflow-hidden text-left glass-effect animate-fade-in-down hover:scale-[1.025] hover:shadow-2xl transition-all duration-300"
                        style={{ borderColor: "#e2e8f0", background: "linear-gradient(135deg, #fafdff 0%, #f7fbfd 100%)" }}
                    >
                        <CardHeader className="pb-3">
                            <div className="space-y-2">
                                <Badge
                                    className="bg-[#eaf0f5] text-[#3a5d74] shadow rounded-full px-4 py-1 text-sm font-semibold tracking-wide mx-auto mb-2 border-0"
                                    style={{ boxShadow: '0 2px 8px 0 rgba(154, 201, 222, 0.10)' }}
                                >
                                    {note.subject.charAt(0).toUpperCase() + note.subject.slice(1)}
                                </Badge>
                                <CardTitle className="text-xl font-medium text-black">
                                    {note.title}
                                </CardTitle>

                                <CardDescription className="text-sm text-[#64748b]">
                                    {note.content}
                                </CardDescription>

                                {note.status === 'pending' && (
                                    <Badge className="mt-2 bg-yellow-100 text-yellow-800">
                                        Pending Review
                                    </Badge>
                                )}
                                {note.status === 'rejected' && (
                                    <Badge className="mt-2 bg-red-100 text-red-800">
                                        Rejected
                                    </Badge>
                                )}
                            </div>
                        </CardHeader>

                        <CardContent className="space-y-4 text-[#64748b]">
                            <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center">
                                    <User className="w-4 h-4 mr-1" /> {note.uploadedBy?.name || "Unknown"}
                                </div>
                                <div className="flex items-center">
                                    <Calendar className="w-4 h-4 mr-1" />
                                    {new Date(note.createdAt).toLocaleDateString()}
                                </div>
                            </div>

                            <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center space-x-4">
                                    <div className="flex items-center text-[#64748b]">
                                        <Download className="w-4 h-4 mr-1" /> {note.downloads || 0}
                                    </div>
                                    <div className="flex items-center text-[#64748b]">
                                        <Eye className="w-4 h-4 mr-1" /> {note.views || 0}
                                    </div>
                                </div>
                                <div className="flex items-center">
                                    <Star className="w-4 h-4 mr-1 fill-yellow-400 text-yellow-400" />
                                    <span className="font-medium">{note.rating || "N/A"}</span>
                                </div>
                            </div>

                            <a
                                href={note.isPremium && !user?.isPremium ? undefined : note.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block"
                                onClick={(e) => {
                                    console.log('Download attempt:', {
                                        noteIsPremium: note.isPremium,
                                        userIsPremium: user?.isPremium,
                                        userRole: user?.role,
                                        userData: user
                                    });
                                    
                                    if (note.isPremium && !user?.isPremium && user?.role !== 'admin') {
                                        e.preventDefault();
                                        navigate('/premium');
                                        window.scrollTo(0, 0);
                                    } else {
                                        trackUserAction.downloadNote(note._id, note.title, note.subject);
                                    }
                                }}
                            >
                                <Button
                                    className={`w-full border border-[#e2e8f0] group-hover:scale-105 transition-all duration-300 shadow-sm ${
                                        note.isPremium 
                                            ? "bg-gradient-to-r from-yellow-500 to-orange-500 text-white hover:from-yellow-600 hover:to-orange-600" 
                                            : "text-[#3a5d74] bg-white group-hover:bg-[#9AC9DE] group-hover:text-white"
                                    }`}
                                    variant={note.isPremium ? "default" : "outline"}
                                    style={{ boxShadow: '0 2px 8px 0 rgba(154, 201, 222, 0.10)' }}
                                >
                                    <Download className="w-4 h-4 mr-2" />
                                    {note.isPremium && !user?.isPremium ? "Get Premium Access" : note.isPremium ? "Download Premium" : "Download"}
                                </Button>
                            </a>
                        </CardContent>
                    </Card>
                ))}
            </section>

            {filteredNotes.length === 0 && (
                <div className="text-center py-12 text-[#64748b]">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                        <Search className="w-8 h-8 text-[#64748b]" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2 text-black">No notes found</h3>
                    <p>
                        Try adjusting your search criteria or browse all notes
                    </p>
                </div>
            )}

        </div>
        {showScroll && (
            <button
                onClick={scrollToTop}
                className="fixed bottom-8 right-6 z-50 p-3 rounded-full border-2 border-white bg-gradient-to-br from-[#9AC9DE] via-[#7bbad2] to-[#5fa6c7] text-white shadow-xl hover:scale-110 hover:shadow-2xl focus:ring-4 focus:ring-[#9AC9DE]/40 transition-all duration-300"
                aria-label="Scroll to top"
                style={{ boxShadow: '0 4px 24px 0 rgba(90, 169, 205, 0.18)' }}
            >
                <ArrowUp className="w-6 h-6" />
            </button>
        )}
        </>
    );
}
