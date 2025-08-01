import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../types';
import { taskService } from '../../services/taskService';
import { useToast } from '../common/ToastProvider';

type NavigationProp = StackNavigationProp<RootStackParamList>;

interface QuickCreateTaskModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (newTask?: any) => void;
}

export const QuickCreateTaskModal: React.FC<QuickCreateTaskModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const navigation = useNavigation<NavigationProp>();
  const { showToast } = useToast();
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!description.trim()) {
      showToast('请输入任务描述', 'warning');
      return;
    }

    setLoading(true);
    try {
      // 使用智能创建任务，以便AI分析时间信息
      const newTask = await taskService.smartCreateTask({
        description: description.trim(),
        useSmartSuggestions: true,
      });
      
      setDescription('');
      onClose();
      
      // 显示成功提示
      showToast('任务创建成功！', 'success');
      
      // 调用成功回调，传递新创建的任务数据
      onSuccess(newTask);
      
    } catch (error) {
      console.error('创建任务失败:', error);
      showToast('创建任务失败，请稍后重试', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setDescription('');
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <TouchableOpacity 
        style={styles.overlay} 
        activeOpacity={1} 
        onPress={() => {
          Keyboard.dismiss();
          handleClose();
        }}
      >
        <TouchableOpacity 
          style={styles.modal}
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.header}>
            <Text style={styles.title}>✨ 快速新建任务</Text>
            <TouchableOpacity onPress={handleClose} disabled={loading}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <Text style={styles.label}>任务描述</Text>
            <TextInput
              style={styles.textInput}
              value={description}
              onChangeText={setDescription}
              placeholder="描述你要做的事情，AI会帮你智能分析..."
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              editable={!loading}
              autoFocus
            />

            <Text style={styles.hint}>
              💡 创建完成后，AI会在后台自动分析任务内容
            </Text>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleClose}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>取消</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, styles.createButton, loading && styles.disabledButton]}
              onPress={handleSubmit}
              disabled={loading || !description.trim()}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.createButtonText}>创建任务</Text>
              )}
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
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
    maxWidth: 400,
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
    fontSize: 20,
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
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    backgroundColor: '#fafafa',
  },
  hint: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  createButton: {
    backgroundColor: '#4CAF50',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
});