export interface EventItem {
    id: string;
    startTime: string;
    endTime: string;
    title: string;
    description?: string;
    category?: string; // Optional for color coding or tagging
}

export interface DaySchedule {
    id: string;
    dayName: string;
    date: string;
    events: EventItem[];
}

export const initialSchedule: DaySchedule[] = [
    {
        id: 'segunda',
        dayName: 'Segunda-feira',
        date: '26/01',
        events: [
            { id: '1-1', startTime: '10:00', endTime: '10:30', title: 'Abertura' },
            { id: '1-2', startTime: '10:30', endTime: '11:30', title: 'Fortinet – Cibersegurança para cidades inteligentes' },
            { id: '1-3', startTime: '13:45', endTime: '14:45', title: 'Almaviva Solutions / Liferay – Institucional Almaviva + Contrato de Operacionalização' },
            { id: '1-4', startTime: '15:00', endTime: '16:30', title: 'Microsoft – Empoderando funcionários com IA – Soluções Low Code integradas' },
        ],
    },
    {
        id: 'terca',
        dayName: 'Terça-feira',
        date: '27/01',
        events: [
            { id: '2-1', startTime: '09:00', endTime: '11:00', title: 'Crowdstrike – Hunting the Adversary' },
            { id: '2-2', startTime: '13:30', endTime: '14:30', title: 'Arlequim Technologies – Apresentação Comercial Arlequim' },
            { id: '2-3', startTime: '14:45', endTime: '15:45', title: 'Pure Storage / Very – Automação, Governança e Segurança com o Pure Storage Enterprise Data Cloud' },
            { id: '2-4', startTime: '16:00', endTime: '18:00', title: 'Oracle – Overview Oracle' },
        ],
    },
    {
        id: 'quarta',
        dayName: 'Quarta-feira',
        date: '28/01',
        events: [
            { id: '3-1', startTime: '09:00', endTime: '12:00', title: 'Trellix – Como vender Segurança Cibernética com a Trellix' },
            { id: '3-2', startTime: '13:30', endTime: '14:30', title: 'Best Project – Overview Best' },
            { id: '3-3', startTime: '14:45', endTime: '16:45', title: 'Google Cloud – IA e produtividade' },
        ],
    },
    {
        id: 'quinta',
        dayName: 'Quinta-feira',
        date: '29/01',
        events: [
            { id: '4-1', startTime: '09:00', endTime: '11:00', title: 'Salesforce – Salesforce Overview' },
            { id: '4-2', startTime: '13:30', endTime: '14:30', title: 'Wars Lab / Aluno Presente – Aluno, presente!' },
            { id: '4-3', startTime: '15:00', endTime: '18:00', title: 'Samsung – Serviços de Nuvem, Datacenter e Segurança' },
        ],
    },
    {
        id: 'sexta',
        dayName: 'Sexta-feira',
        date: '30/01',
        events: [
            { id: '5-1', startTime: '09:00', endTime: '10:30', title: 'AWS – Overview AWS' },
            { id: '5-2', startTime: '13:30', endTime: '15:30', title: 'Telefônica Brasil S/A – Overview Telefônica' },
        ],
    },
];
