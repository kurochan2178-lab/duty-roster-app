import { useState } from 'react';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import { useAppStore } from '../store';
import type { Staff } from '../types';
import { v4 as uuidv4 } from 'uuid';


export function StaffPage() {
    const { staffList, addStaff, updateStaff, removeStaff } = useAppStore();
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form State
    const [formData, setFormData] = useState<Partial<Staff>>({
        name: '',
        targetWeekdayCount: 0,
        targetHolidayCount: 0,
    });

    const resetForm = () => {
        setFormData({ name: '', targetWeekdayCount: 0, targetHolidayCount: 0 });
        setIsAdding(false);
        setEditingId(null);
    };

    const handleSave = () => {
        if (!formData.name) return;

        if (editingId) {
            updateStaff(editingId, formData);
        } else {
            addStaff({
                id: uuidv4(),
                name: formData.name,
                targetWeekdayCount: formData.targetWeekdayCount || 0,
                targetHolidayCount: formData.targetHolidayCount || 0,
                unavailability: [],
                preferences: [],
            });
        }
        resetForm();
    };

    const startEdit = (staff: Staff) => {
        setEditingId(staff.id);
        setFormData({
            name: staff.name,
            targetWeekdayCount: staff.targetWeekdayCount,
            targetHolidayCount: staff.targetHolidayCount,
        });
        setIsAdding(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">職員管理</h2>
                {!isAdding && (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                    >
                        <Plus size={18} />
                        <span>新規追加</span>
                    </button>
                )}
            </div>

            {isAdding && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-indigo-100 animate-in fade-in slide-in-from-top-4">
                    <h3 className="text-lg font-semibold mb-4">{editingId ? '職員を編集' : '新規職員を追加'}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">氏名</label>
                            <input
                                type="text"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="山田 太郎"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">平日目標回数</label>
                            <input
                                type="number"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                value={formData.targetWeekdayCount}
                                onChange={(e) => setFormData({ ...formData, targetWeekdayCount: parseInt(e.target.value) || 0 })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">休日目標回数</label>
                            <input
                                type="number"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                value={formData.targetHolidayCount}
                                onChange={(e) => setFormData({ ...formData, targetHolidayCount: parseInt(e.target.value) || 0 })}
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3">
                        <button
                            onClick={resetForm}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                        >
                            キャンセル
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                        >
                            保存
                        </button>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-500 text-sm">
                        <tr>
                            <th className="px-6 py-3 font-medium">氏名</th>
                            <th className="px-6 py-3 font-medium">平日目標</th>
                            <th className="px-6 py-3 font-medium">休日目標</th>
                            <th className="px-6 py-3 font-medium text-right">操作</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {staffList.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-8 text-center text-gray-400">
                                    職員が登録されていません
                                </td>
                            </tr>
                        ) : (
                            staffList.map((staff) => (
                                <tr key={staff.id} className="hover:bg-gray-50 group">
                                    <td className="px-6 py-4 font-medium text-gray-900">{staff.name}</td>
                                    <td className="px-6 py-4 text-gray-600">{staff.targetWeekdayCount}回</td>
                                    <td className="px-6 py-4 text-gray-600">{staff.targetHolidayCount}回</td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => startEdit(staff)}
                                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => removeStaff(staff.id)}
                                                className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
