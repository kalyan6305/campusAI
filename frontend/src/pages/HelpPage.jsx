import React, { useState } from 'react';
import { Search, Book, Sparkles, Shield, Zap, MessageSquare } from 'lucide-react';

const HelpPage = () => {
    const [searchQuery, setSearchQuery] = useState('');

    const faqs = [
        {
            id: 1,
            icon: <Sparkles className="w-5 h-5 text-purple-500" />,
            question: "What is Campus AI?",
            answer: "Campus AI is an elite AI Operating System designed for students. It combines multiple specialized agents (Coding, Career, Research) with a powerful core LLM to help you excel in your academic journey."
        },
        {
            id: 2,
            icon: <Zap className="w-5 h-5 text-yellow-500" />,
            question: "How do I change the AI's personality?",
            answer: "You can use the 'Personalization' settings in your profile menu. There, you can define a nickname, your role, and provide 'Custom Instructions' that strictly dictate how the AI should behave and respond."
        },
        {
            id: 3,
            icon: <Shield className="w-5 h-5 text-green-500" />,
            question: "Is my data secure?",
            answer: "Yes. All your conversations are private and secured. We use industry-standard encryption, and your personalized data is only used to enhance your specific AI experience."
        },
        {
            id: 4,
            icon: <MessageSquare className="w-5 h-5 text-blue-500" />,
            question: "What languages does the AI support?",
            answer: "The AI supports over 50+ languages, including Telugu, Hindi, Spanish, French, and more. You can set your preferred language in the 'General Settings' popup."
        },
        {
            id: 5,
            icon: <Book className="w-5 h-5 text-orange-500" />,
            question: "How do I use specialized agents?",
            answer: "Navigate to the 'Agents' page from the sidebar. From there, you can select specialized assistants like the Coding Agent for programming help or the Study Planner for creating academic schedules."
        }
    ];

    const filteredFaqs = faqs.filter(faq =>
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-full bg-gray-50 dark:bg-gray-900 p-8 font-sans animate-fade-in">
            <div className="max-w-4xl mx-auto space-y-12">
                {/* Header */}
                <div className="text-center space-y-4">
                    <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">How can we help you today?</h1>
                    <p className="text-gray-500 dark:text-gray-400 font-medium">Search for questions about Campus AI and its capabilities.</p>
                </div>

                {/* Search Bar */}
                <div className="relative group">
                    <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                        <Search className="w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search for help (e.g., 'How to change instructions', 'Data security')..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-[2rem] px-16 py-6 text-lg font-bold text-gray-800 dark:text-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 shadow-xl shadow-gray-200/50 dark:shadow-none transition-all placeholder:text-gray-300 dark:placeholder:text-gray-600"
                    />
                </div>

                {/* FAQ Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
                    {filteredFaqs.length > 0 ? (
                        filteredFaqs.map(faq => (
                            <div key={faq.id} className="bg-white dark:bg-gray-800 p-8 rounded-[2rem] border border-gray-50 dark:border-gray-700/50 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group">
                                <div className="flex items-start gap-4">
                                    <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-2xl group-hover:scale-110 transition-transform">
                                        {faq.icon}
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-lg font-black text-gray-900 dark:text-white leading-tight">{faq.question}</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium leading-relaxed">{faq.answer}</p>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full py-20 text-center space-y-4 bg-white dark:bg-gray-800 rounded-[2rem] border-2 border-dashed border-gray-100 dark:border-gray-800">
                            <div className="flex flex-col items-center gap-4">
                                <Search className="w-12 h-12 text-gray-200 dark:text-gray-700" />
                                <p className="text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest text-xs">No matching questions found</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default HelpPage;
