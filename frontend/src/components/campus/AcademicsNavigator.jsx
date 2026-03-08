import React from 'react';
import useRagStore from '../../store/ragStore';

const AcademicsNavigator = () => {
    const {
        regulation, setRegulation,
        branch, setBranch,
        year, setYear,
        semester, setSemester,
        contentType, setContentType
    } = useRagStore();

    const options = {
        regulations: ['R23', 'R20'],
        branches: ['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL'],
        years: ['1', '2', '3', '4'],
        semesters: ['Sem1', 'Sem2'],
        contentTypes: ['Subjects', 'Syllabus'],
    };

    const NavSection = ({ label, current, options, setter }) => (
        <div className="flex flex-col gap-2">
            <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.1em]">{label}</span>
            <div className="flex flex-wrap gap-2">
                {options.map((opt) => (
                    <button
                        key={opt}
                        onClick={() => setter(opt)}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all duration-200 uppercase tracking-wider ${current === opt
                            ? 'bg-blue-600 dark:bg-blue-700 text-white shadow-sm border border-blue-700 dark:border-blue-600'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-200 border border-transparent'
                            }`}
                    >
                        {opt}
                    </button>
                ))}
            </div>
        </div>
    );

    return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 space-y-4 animate-slide-up shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                <NavSection label="Regulation" current={regulation} options={options.regulations} setter={setRegulation} />
                <NavSection label="Branch" current={branch} options={options.branches} setter={setBranch} />
                <NavSection label="Year" current={year} options={options.years} setter={setYear} />
                <NavSection label="Semester" current={semester} options={options.semesters} setter={setSemester} />
                <NavSection label="Content" current={contentType} options={options.contentTypes} setter={setContentType} />
            </div>
        </div>
    );
};

export default AcademicsNavigator;
