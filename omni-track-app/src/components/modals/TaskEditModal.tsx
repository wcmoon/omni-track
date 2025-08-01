import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { Task } from '../../types';
import DateTimePicker from '@react-native-community/datetimepicker';

interface TaskEditModalProps {
  visible: boolean;
  task: Task | null;
  editField: 'priority' | 'duration' | 'dueDate' | 'recurrence' | 'tags' | null;
  onClose: () => void;
  onSave: (taskId: string, updates: Partial<Task>) => void;
}

export const TaskEditModal: React.FC<TaskEditModalProps> = ({
  visible,
  task,
  editField,
  onClose,
  onSave,
}) => {
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [duration, setDuration] = useState('');
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dueTime, setDueTime] = useState<Date | null>(null);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [includeTime, setIncludeTime] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceType, setRecurrenceType] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [recurrenceInterval, setRecurrenceInterval] = useState('1');
  const [newTag, setNewTag] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  useEffect(() => {
    if (task) {
      setPriority(task.priority || 'medium');
      setDuration(task.estimatedDuration?.toString() || '');
      setDueDate(task.dueDate || null);
      
      // 处理时间初始化
      if (task.dueDate && task.endTime) {
        const [hours, minutes] = task.endTime.split(':').map(Number);
        const timeDate = new Date();
        timeDate.setHours(hours, minutes, 0, 0);
        setDueTime(timeDate);
        setIncludeTime(true);
      } else {
        setDueTime(null);
        setIncludeTime(false);
      }
      
      setIsRecurring(task.isRecurring || false);
      setRecurrenceType(task.recurrencePattern?.type || 'daily');
      setRecurrenceInterval(task.recurrencePattern?.interval?.toString() || '1');
      setTags(task.tags || []);
    }
  }, [task]);

  useEffect(() => {
    // 当编辑截止日期且没有现有日期时，默认设置为今天
    if (editField === 'dueDate' && task && !task.dueDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // 设置到天，不包含小时分钟
      setDueDate(today);
    }
  }, [editField, task]);

  useEffect(() => {
    // 当编辑截止日期时自动显示日期选择器
    setShowDatePicker(editField === 'dueDate');
  }, [editField]);

  const handleSave = () => {
    if (!task) return;

    const updates: Partial<Task> = {};

    switch (editField) {
      case 'priority':
        updates.priority = priority;
        break;
      case 'duration':
        const durationNum = parseInt(duration);
        if (!isNaN(durationNum) && durationNum > 0) {
          updates.estimatedDuration = durationNum;
        }
        break;
      case 'dueDate':
        if (dueDate) {
          if (includeTime && dueTime) {
            // 组合日期和时间
            const combinedDateTime = new Date(dueDate);
            combinedDateTime.setHours(
              dueTime.getHours(),
              dueTime.getMinutes(),
              0,
              0
            );
            updates.dueDate = combinedDateTime;
            // 保存时间信息到endTime字段
            updates.endTime = `${dueTime.getHours().toString().padStart(2, '0')}:${dueTime.getMinutes().toString().padStart(2, '0')}`;
          } else {
            // 只保存日期，清除时间
            const dateOnly = new Date(dueDate);
            dateOnly.setHours(0, 0, 0, 0);
            updates.dueDate = dateOnly;
            updates.endTime = undefined;
          }
        } else {
          updates.dueDate = null;
          updates.endTime = undefined;
        }
        break;
      case 'recurrence':
        updates.isRecurring = isRecurring;
        if (isRecurring) {
          const interval = parseInt(recurrenceInterval) || 1;
          updates.recurrencePattern = {
            type: recurrenceType,
            interval: interval,
          };
        } else {
          updates.recurrencePattern = undefined;
        }
        break;
      case 'tags':
        updates.tags = tags;
        break;
    }

    onSave(task.id, updates);
    onClose();
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const renderContent = () => {
    switch (editField) {
      case 'priority':
        return (
          <View>
            <Text style={styles.label}>优先级</Text>
            <View style={styles.priorityOptions}>
              {(['low', 'medium', 'high'] as const).map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[
                    styles.priorityOption,
                    priority === p && styles.selectedPriorityOption,
                    { backgroundColor: getPriorityColor(p) }
                  ]}
                  onPress={() => setPriority(p)}
                >
                  <Text style={styles.priorityOptionText}>
                    {p === 'high' ? '高' : p === 'medium' ? '中' : '低'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 'duration':
        return (
          <View>
            <Text style={styles.label}>预估时长（分钟）</Text>
            <TextInput
              style={styles.textInput}
              value={duration}
              onChangeText={setDuration}
              placeholder="例如：60"
              keyboardType="numeric"
            />
          </View>
        );

      case 'dueDate':
        return (
          <View>
            <Text style={styles.label}>截止时间</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker(!showDatePicker)}
            >
              <Text style={styles.dateButtonText}>
                {dueDate ? dueDate.toLocaleDateString('zh-CN') : '选择日期'}
              </Text>
            </TouchableOpacity>
            
            {showDatePicker && (
              <View style={styles.datePickerContainer}>
                <DateTimePicker
                  value={dueDate || new Date()}
                  mode="date"
                  display="spinner"
                  onChange={(event, selectedDate) => {
                    if (selectedDate) {
                      // 设置到天，不包含小时分钟
                      const dateOnly = new Date(selectedDate);
                      dateOnly.setHours(0, 0, 0, 0);
                      setDueDate(dateOnly);
                    }
                  }}
                  style={styles.datePicker}
                />
              </View>
            )}
            
            {/* 时间选择开关 */}
            {dueDate && (
              <View style={styles.timeToggleContainer}>
                <Text style={styles.timeToggleLabel}>包含具体时间</Text>
                <Switch
                  value={includeTime}
                  onValueChange={(value) => {
                    setIncludeTime(value);
                    if (value && !dueTime) {
                      // 默认设置为当前时间
                      const now = new Date();
                      setDueTime(now);
                    }
                  }}
                />
              </View>
            )}

            {/* 时间选择器 - 紧凑模式 */}
            {includeTime && dueDate && (
              <View style={styles.compactTimeContainer}>
                <Text style={styles.timeLabel}>具体时间</Text>
                <DateTimePicker
                  value={dueTime || new Date()}
                  mode="time"
                  display="compact"
                  onChange={(event, selectedTime) => {
                    if (selectedTime) {
                      setDueTime(selectedTime);
                    }
                  }}
                  style={styles.compactTimePicker}
                />
              </View>
            )}

            {dueDate && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => {
                  setDueDate(null);
                  setDueTime(null);
                  setIncludeTime(false);
                  setShowDatePicker(false);
                  setShowTimePicker(false);
                }}
              >
                <Text style={styles.clearButtonText}>清除日期</Text>
              </TouchableOpacity>
            )}
          </View>
        );

      case 'recurrence':
        return (
          <View>
            <View style={styles.switchRow}>
              <Text style={styles.label}>设为循环任务</Text>
              <Switch
                value={isRecurring}
                onValueChange={setIsRecurring}
              />
            </View>
            {isRecurring && (
              <View style={styles.recurrenceOptions}>
                <Text style={styles.label}>循环间隔</Text>
                <View style={styles.intervalRow}>
                  <TextInput
                    style={styles.intervalInput}
                    value={recurrenceInterval}
                    onChangeText={setRecurrenceInterval}
                    placeholder="1"
                    keyboardType="numeric"
                  />
                  <View style={styles.unitSelector}>
                    {(['daily', 'weekly', 'monthly'] as const).map((type) => (
                      <TouchableOpacity
                        key={type}
                        style={[
                          styles.unitOption,
                          recurrenceType === type && styles.selectedUnitOption
                        ]}
                        onPress={() => setRecurrenceType(type)}
                      >
                        <Text style={[
                          styles.unitOptionText,
                          recurrenceType === type && styles.selectedUnitOptionText
                        ]}>
                          {type === 'daily' ? '天' : type === 'weekly' ? '周' : '月'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                <Text style={styles.intervalHint}>
                  每 {recurrenceInterval || '1'} {recurrenceType === 'daily' ? '天' : recurrenceType === 'weekly' ? '周' : '月'}重复一次
                </Text>
              </View>
            )}
          </View>
        );

      case 'tags':
        return (
          <View>
            <Text style={styles.label}>标签</Text>
            <View style={styles.tagInput}>
              <TextInput
                style={styles.tagTextInput}
                value={newTag}
                onChangeText={setNewTag}
                placeholder="添加标签"
                onSubmitEditing={addTag}
              />
              <TouchableOpacity style={styles.addTagButton} onPress={addTag}>
                <Text style={styles.addTagButtonText}>添加</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.tagsContainer}>
              {tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                  <TouchableOpacity
                    style={styles.tagRemoveButton}
                    onPress={() => removeTag(tag)}
                    hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
                  >
                    <Text style={styles.tagRemove}>×</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#F44336';
      case 'medium': return '#FF9800';
      case 'low': return '#4CAF50';
      default: return '#9E9E9E';
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>编辑任务</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeButton}>×</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.content}>
            {renderContent()}
          </ScrollView>
          
          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>取消</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>保存</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '100%',
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    fontSize: 24,
    color: '#666',
    padding: 4,
  },
  content: {
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  priorityOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  priorityOption: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  selectedPriorityOption: {
    opacity: 1,
  },
  priorityOptionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  dateButton: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#f8f8f8',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#333',
  },
  clearButton: {
    marginTop: 8,
    padding: 8,
    alignItems: 'center',
  },
  clearButtonText: {
    color: '#F44336',
    fontSize: 14,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  recurrenceOptions: {
    gap: 8,
  },
  recurrenceOption: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    backgroundColor: '#f8f8f8',
  },
  selectedRecurrenceOption: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  recurrenceOptionText: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
  selectedRecurrenceOptionText: {
    color: '#fff',
  },
  intervalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  intervalInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minWidth: 60,
    textAlign: 'center',
  },
  unitSelector: {
    flexDirection: 'row',
    flex: 1,
    gap: 8,
  },
  unitOption: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    backgroundColor: '#f8f8f8',
    alignItems: 'center',
  },
  selectedUnitOption: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  unitOptionText: {
    fontSize: 14,
    color: '#333',
  },
  selectedUnitOptionText: {
    color: '#fff',
  },
  intervalHint: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  datePickerContainer: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    marginTop: 8,
    padding: 8,
  },
  datePicker: {
    backgroundColor: 'transparent',
  },
  timeToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    padding: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  timeToggleLabel: {
    fontSize: 16,
    color: '#333',
  },
  compactTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
  },
  timeLabel: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  compactTimePicker: {
    flex: 1,
    maxWidth: 120,
  },
  tagInput: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  tagTextInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  addTagButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
  },
  addTagButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  tagText: {
    fontSize: 12,
    color: '#1976d2',
  },
  tagRemoveButton: {
    padding: 2,
  },
  tagRemove: {
    fontSize: 14,
    color: '#1976d2',
    fontWeight: 'bold',
    lineHeight: 14,
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  cancelButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
  },
  saveButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    backgroundColor: '#2196F3',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
});