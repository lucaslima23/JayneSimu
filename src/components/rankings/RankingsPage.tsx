// ============================================
// MEDPREP LMS - RANKINGS PAGE
// ============================================

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Medal, Trophy, Target, Flame, Loader2, Lock, Unlock } from 'lucide-react';
import { Card } from '../common';
import { analyticsService, userService } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { clsx } from 'clsx';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';

interface RankingEntry {
    userId: string;
    userName: string;
    dailyAverage: number;
    accuracy: number;
    totalQuestions: number;
    subjectAccuracy: Record<string, number>;
    rank: number;
}

interface RankingsData {
    assiduidade: RankingEntry[];
    accuracy: RankingEntry[];
    globalSubjectAccuracy: Record<string, number>;
    globalAverageAccuracy: number;
}

function getMedalColor(rank: number) {
    if (rank === 1) return 'text-yellow-400';
    if (rank === 2) return 'text-slate-300';
    if (rank === 3) return 'text-amber-600';
    return 'text-secondary-500';
}

function RankingItem({ entry, isCurrentUser, type }: { entry: RankingEntry, isCurrentUser: boolean, type: 'assiduidade' | 'accuracy' }) {
    const isTop3 = entry.rank <= 3;
    const valueStr = type === 'assiduidade'
        ? `${entry.dailyAverage.toFixed(1)} q/dia`
        : `${entry.accuracy.toFixed(1)}%`;

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: entry.rank * 0.1 }}
            className={clsx(
                "flex items-center gap-4 p-4 rounded-xl border transition-all",
                isCurrentUser
                    ? "bg-primary-500/10 border-primary-500/50 shadow-glow"
                    : "bg-secondary-800 border-secondary-700",
                isTop3 && !isCurrentUser ? "bg-secondary-800/80" : ""
            )}
        >
            <div className="w-8 h-8 flex items-center justify-center font-bold text-lg">
                {isTop3 ? (
                    <Trophy className={clsx("w-6 h-6", getMedalColor(entry.rank))} />
                ) : (
                    <span className="text-secondary-400">#{entry.rank}</span>
                )}
            </div>

            <div className="flex-1">
                <p className={clsx("font-semibold", isCurrentUser ? "text-primary-400" : "text-secondary-100")}>
                    {isCurrentUser ? "Você" : entry.userName}
                </p>
                <p className="text-xs text-secondary-500 font-medium tracking-wide">
                    {entry.totalQuestions} questões resolvidas
                </p>
            </div>

            <div className="text-right">
                <p className={clsx("font-bold text-lg", isCurrentUser ? "text-white" : "text-secondary-200")}>
                    {valueStr}
                </p>
            </div>
        </motion.div>
    );
}

export default function RankingsPage() {
    const { user, updateUser } = useAuth();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<RankingsData | null>(null);
    const [isSavingOptIn, setIsSavingOptIn] = useState(false);

    const isOptedIn = user?.settings?.rankingOptIn === true;

    useEffect(() => {
        const fetchRankings = async () => {
            setLoading(true);
            const res = await analyticsService.getGlobalRankings(15);
            setData(res as unknown as RankingsData);
            setLoading(false);
        };
        fetchRankings();
    }, []);

    const handleToggleOptIn = async () => {
        if (!user || isSavingOptIn) return;

        const now = new Date();
        const lastOptInDateStr = user.settings?.rankingOptInDate;

        // Se o usuário está tentando DESLIGAR
        if (isOptedIn) {
            if (lastOptInDateStr) {
                const lastDate = new Date(lastOptInDateStr);
                const diffTime = Math.abs(now.getTime() - lastDate.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays < 15) {
                    alert(`Você não pode ocultar seu perfil no ranking ainda. É necessário aguardar 15 dias após a última alteração. Faltam ${15 - diffDays} dias.`);
                    return;
                }
            }
            // Pode desligar se passou do tempo
            await updateOptInStatus(false, now.toISOString());
        } else {
            // Se o usuário está tentando LIGAR
            const confirmAlert = window.confirm("Ao ativar, seus resultados aparecerão no ranking geral e você não poderá ocultá-los por 15 dias. Deseja continuar?");
            if (!confirmAlert) return;
            await updateOptInStatus(true, now.toISOString());
        }
    };

    const updateOptInStatus = async (optInValue: boolean, dateStr: string) => {
        setIsSavingOptIn(true);
        try {
            const newSettings = {
                ...(user?.settings || {}),
                rankingOptIn: optInValue,
                rankingOptInDate: dateStr
            };
            await userService.updateSettings(user!.uid, newSettings);
            updateUser({ settings: newSettings } as any);
        } catch (error) {
            console.error("Erro ao atualizar preferência de ranking", error);
            alert("Erro ao salvar configuração.");
        } finally {
            setIsSavingOptIn(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary-500 animate-spin mb-4" />
                <p className="text-secondary-400">Calculando rankings globais...</p>
            </div>
        );
    }

    if (!data) return null;

    // Filter to show Top 3 + Current User (if not in top 3)
    const prepareList = (list: RankingEntry[]) => {
        const top3 = list.slice(0, 3);
        const currentUserEntry = list.find(u => u.userId === user?.uid);

        if (currentUserEntry && currentUserEntry.rank > 3) {
            return [...top3, currentUserEntry];
        }
        return top3;
    };

    const assiduidadeList = prepareList(data.assiduidade);
    const accuracyList = prepareList(data.accuracy);

    // Chart Data Preparation
    const currentUserStats = data.accuracy.find(u => u.userId === user?.uid);
    const chartData = Object.keys(data.globalSubjectAccuracy).map(subject => {
        return {
            subject: subject.charAt(0).toUpperCase() + subject.slice(1),
            global: Number(data.globalSubjectAccuracy[subject].toFixed(1)),
            user: currentUserStats?.subjectAccuracy[subject] ? Number(currentUserStats.subjectAccuracy[subject].toFixed(1)) : 0
        };
    });

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-glow">
                        <Medal className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-display font-bold text-white">Rankings Globais</h1>
                        <p className="text-secondary-400">Classificação e desempenho dos últimos 15 dias</p>
                    </div>
                </div>

                {/* iOS Style Toggle */}
                <div className="flex items-center gap-3 bg-secondary-800/50 p-3 rounded-xl border border-secondary-700">
                    <span className="text-sm font-medium text-secondary-200">
                        Apresentar meus resultados no ranking geral
                    </span>
                    <button
                        onClick={handleToggleOptIn}
                        disabled={isSavingOptIn}
                        className={clsx(
                            "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-secondary-900 shadow-inner",
                            isOptedIn ? "bg-accent-emerald" : "bg-secondary-600",
                            isSavingOptIn && "opacity-50 cursor-not-allowed"
                        )}
                    >
                        <span className="sr-only">Toggle global ranking participation</span>
                        <span
                            aria-hidden="true"
                            className={clsx(
                                "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                                isOptedIn ? "translate-x-5" : "translate-x-0"
                            )}
                        />
                    </button>
                </div>
            </motion.div>

            {/* Container for the Blur effect */}
            <div className="relative">
                {!isOptedIn && (
                    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center rounded-xl bg-secondary-900/60 backdrop-blur-[2px] border border-secondary-700 shadow-[inset_0_0_100px_rgba(0,0,0,0.8)]">
                        <Lock className="w-16 h-16 text-secondary-500 mb-4" />
                        <h3 className="text-2xl font-bold text-white mb-2 text-center px-4">Ranking Bloqueado</h3>
                        <p className="text-secondary-300 text-center max-w-md px-6 mb-6">
                            Você precisa habilitar "Apresentar meus resultados no ranking geral" acima para participar e visualizar a classificação global da plataforma.
                        </p>
                        <button
                            onClick={handleToggleOptIn}
                            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-500 text-white font-semibold py-3 px-6 rounded-xl transition-all shadow-glow"
                        >
                            <Unlock className="w-5 h-5" />
                            Habilitar Participação no Ranking
                        </button>
                    </div>
                )}

                <div className={clsx("grid grid-cols-1 lg:grid-cols-2 gap-6 transition-all duration-500", !isOptedIn && "blur-md opacity-30 pointer-events-none select-none overflow-hidden")}>
                    {/* Assiduidade */}
                    <Card className="p-6">
                        <div className="flex items-center gap-2 mb-6">
                            <Flame className="w-5 h-5 text-accent-amber" />
                            <h2 className="text-xl font-bold text-white">Top Assiduidade</h2>
                        </div>
                        <div className="space-y-3">
                            {assiduidadeList.length > 0 ? (
                                assiduidadeList.map((entry, idx) => (
                                    <RankingItem
                                        key={`ass_${entry.userId}_${idx}`}
                                        entry={entry}
                                        isCurrentUser={entry.userId === user?.uid}
                                        type="assiduidade"
                                    />
                                ))
                            ) : (
                                <p className="text-secondary-500 text-center py-4">Poucos dados nos últimos 15 dias.</p>
                            )}
                        </div>
                    </Card>

                    {/* Taxa de Acerto */}
                    <Card className="p-6">
                        <div className="flex items-center gap-2 mb-6">
                            <Target className="w-5 h-5 text-primary-400" />
                            <h2 className="text-xl font-bold text-white">Top Precisão</h2>
                        </div>
                        <div className="space-y-3">
                            {accuracyList.length > 0 ? (
                                accuracyList.map((entry, idx) => (
                                    <RankingItem
                                        key={`acc_${entry.userId}_${idx}`}
                                        entry={entry}
                                        isCurrentUser={entry.userId === user?.uid}
                                        type="accuracy"
                                    />
                                ))
                            ) : (
                                <p className="text-secondary-500 text-center py-4">Poucos dados nos últimos 15 dias.</p>
                            )}
                        </div>
                    </Card>
                </div>

                {/* Gráfico Comparativo */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                    <Card className="p-6">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-xl font-bold text-white">Seu Desempenho vs. Média Global</h2>
                                <p className="text-sm text-secondary-400">Taxa de acerto (%) por Grande Área nos últimos 15 dias</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-secondary-400 uppercase font-bold tracking-wider mb-1">Média Global Geral</p>
                                <p className="text-2xl font-bold text-white">{data.globalAverageAccuracy.toFixed(1)}%</p>
                            </div>
                        </div>

                        <div className="h-[350px] w-full mt-4">
                            {chartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                        <XAxis
                                            dataKey="subject"
                                            stroke="#94a3b8"
                                            tick={{ fill: '#94a3b8', fontSize: 12 }}
                                            tickLine={false}
                                            axisLine={false}
                                        />
                                        <YAxis
                                            stroke="#94a3b8"
                                            tick={{ fill: '#94a3b8', fontSize: 12 }}
                                            tickLine={false}
                                            axisLine={false}
                                            domain={[0, 100]}
                                            tickFormatter={(value) => `${value}%`}
                                        />
                                        <Tooltip
                                            cursor={{ fill: '#334155', opacity: 0.4 }}
                                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '0.75rem', color: '#f8fafc' }}
                                            itemStyle={{ color: '#f8fafc' }}
                                            formatter={(value: number) => [`${value}%`]}
                                        />
                                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                        <Bar dataKey="user" name="Sua Precisão" fill="#0ea5e9" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                        <Bar dataKey="global" name="Média Global" fill="#475569" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center border border-dashed border-secondary-700 rounded-xl">
                                    <Target className="w-8 h-8 text-secondary-600 mb-2" />
                                    <p className="text-secondary-400">Nenhum dado de questão encontrado neste período.</p>
                                </div>
                            )}
                        </div>
                    </Card>
                </motion.div>

            </div> {/* End of the Relative Blur Wrapper */}

        </div>
    );
}
