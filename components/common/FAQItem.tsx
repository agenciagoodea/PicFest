
import React from 'react';

interface FAQItemProps {
    question: string;
    answer: string;
}

export const FAQItem: React.FC<FAQItemProps> = ({ question, answer }) => {
    const [isOpen, setIsOpen] = React.useState(false);
    return (
        <div className={`border rounded-[1.5rem] transition-all duration-300 cursor-pointer overflow-hidden ${isOpen ? 'bg-white/5 border-primary/30' : 'bg-white/5 border-white/5 hover:bg-white/[0.08]'}`} onClick={() => setIsOpen(!isOpen)}>
            <div className="p-6 flex justify-between items-center">
                <h4 className="font-bold text-slate-200">{question}</h4>
                <span className={`material-symbols-outlined transition-transform duration-300 ${isOpen ? 'rotate-180 text-primary' : 'text-slate-500'}`}>expand_more</span>
            </div>
            <div className={`px-6 pb-6 text-sm text-slate-500 leading-relaxed transition-all duration-300 ${isOpen ? 'block animate-in fade-in slide-in-from-top-2' : 'hidden'}`}>
                {answer}
            </div>
        </div>
    );
};
