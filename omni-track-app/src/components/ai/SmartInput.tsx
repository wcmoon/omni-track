import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { aiService } from '../../services/aiService';

interface SmartInputProps {
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  onSuggestionsSelect?: (suggestions: any) => void;
  type?: 'task' | 'log';
  multiline?: boolean;
  autoSuggest?: boolean;
}

interface Suggestion {
  type: string;
  text: string;
  confidence: number;
}

export const SmartInput: React.FC<SmartInputProps> = ({
  placeholder = '请输入内容...',
  value,
  onChangeText,
  onSuggestionsSelect,
  type = 'task',
  multiline = false,
  autoSuggest = true,
}) => {
  const [suggestions, setSuggestions] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const debounceTimeout = React.useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!autoSuggest || !value || value.length < 10) {
      setSuggestions(null);
      setShowSuggestions(false);
      return;
    }

    // 防抖处理
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = setTimeout(() => {
      generateSuggestions(value);
    }, 1000);

    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, [value, autoSuggest]);

  const generateSuggestions = async (text: string) => {
    try {
      setLoading(true);
      
      if (type === 'task') {
        const taskSuggestions = await aiService.getTaskSuggestions(text);
        setSuggestions(taskSuggestions);
      } else if (type === 'log') {
        const logSuggestions = await aiService.getLogTagSuggestions(text);
        setSuggestions(logSuggestions);
      }
      
      setShowSuggestions(true);
    } catch (error) {
      console.error('生成建议失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApplySuggestions = () => {
    if (suggestions && onSuggestionsSelect) {
      onSuggestionsSelect(suggestions);
      setShowSuggestions(false);
    }
  };

  const renderTaskSuggestions = () => {
    if (!suggestions || type !== 'task') return null;

    return (
      <View style={styles.suggestionsContainer}>
        <View style={styles.suggestionHeader}>
          <Text style={styles.suggestionTitle}>🤖 AI建议</Text>
          <TouchableOpacity
            style={styles.applyButton}
            onPress={handleApplySuggestions}
          >
            <Text style={styles.applyButtonText}>应用建议</Text>
          </TouchableOpacity>
        </View>

        {suggestions.suggestedTitle && (
          <View style={styles.suggestionItem}>
            <Text style={styles.suggestionLabel}>建议标题:</Text>
            <Text style={styles.suggestionText}>{suggestions.suggestedTitle}</Text>
          </View>
        )}

        {suggestions.priority && (
          <View style={styles.suggestionItem}>
            <Text style={styles.suggestionLabel}>优先级:</Text>
            <Text
              style={[
                styles.priorityTag,
                suggestions.priority === 'high' && styles.highPriority,
                suggestions.priority === 'medium' && styles.mediumPriority,
                suggestions.priority === 'low' && styles.lowPriority,
              ]}
            >
              {suggestions.priority === 'high'
                ? '高'
                : suggestions.priority === 'medium'
                ? '中'
                : '低'}
            </Text>
          </View>
        )}

        {suggestions.suggestedTags && suggestions.suggestedTags.length > 0 && (
          <View style={styles.suggestionItem}>
            <Text style={styles.suggestionLabel}>建议标签:</Text>
            <View style={styles.tagsContainer}>
              {suggestions.suggestedTags.slice(0, 5).map((tag: string, index: number) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {suggestions.breakdown && suggestions.breakdown.length > 0 && (
          <View style={styles.suggestionItem}>
            <Text style={styles.suggestionLabel}>任务分解:</Text>
            {suggestions.breakdown.slice(0, 3).map((item: string, index: number) => (
              <Text key={index} style={styles.breakdownItem}>
                • {item}
              </Text>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderLogSuggestions = () => {
    if (!suggestions || type !== 'log') return null;

    return (
      <View style={styles.suggestionsContainer}>
        <View style={styles.suggestionHeader}>
          <Text style={styles.suggestionTitle}>🤖 AI分析</Text>
          <TouchableOpacity
            style={styles.applyButton}
            onPress={handleApplySuggestions}
          >
            <Text style={styles.applyButtonText}>应用建议</Text>
          </TouchableOpacity>
        </View>

        {suggestions.sentiment && (
          <View style={styles.suggestionItem}>
            <Text style={styles.suggestionLabel}>情感分析:</Text>
            <Text
              style={[
                styles.sentimentTag,
                suggestions.sentiment === 'positive' && styles.positiveSentiment,
                suggestions.sentiment === 'negative' && styles.negativeSentiment,
                suggestions.sentiment === 'neutral' && styles.neutralSentiment,
              ]}
            >
              {suggestions.sentiment === 'positive'
                ? '积极'
                : suggestions.sentiment === 'negative'
                ? '消极'
                : '中性'}
            </Text>
          </View>
        )}

        {suggestions.topics && suggestions.topics.length > 0 && (
          <View style={styles.suggestionItem}>
            <Text style={styles.suggestionLabel}>主题:</Text>
            <View style={styles.tagsContainer}>
              {suggestions.topics.map((topic: string, index: number) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{topic}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {suggestions.suggestedTags && suggestions.suggestedTags.length > 0 && (
          <View style={styles.suggestionItem}>
            <Text style={styles.suggestionLabel}>建议标签:</Text>
            <View style={styles.tagsContainer}>
              {suggestions.suggestedTags.slice(0, 5).map((tag: string, index: number) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={[styles.textInput, multiline && styles.multilineInput]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
      />

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#2196F3" />
          <Text style={styles.loadingText}>正在分析...</Text>
        </View>
      )}

      {showSuggestions && !loading && (
        <ScrollView style={styles.suggestionsScroll} showsVerticalScrollIndicator={false}>
          {type === 'task' ? renderTaskSuggestions() : renderLogSuggestions()}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  multilineInput: {
    minHeight: 80,
    maxHeight: 150,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginTop: 8,
  },
  loadingText: {
    marginLeft: 8,
    color: '#666',
    fontSize: 14,
  },
  suggestionsScroll: {
    maxHeight: 300,
    marginTop: 8,
  },
  suggestionsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  suggestionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  suggestionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  applyButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  suggestionItem: {
    marginBottom: 12,
  },
  suggestionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  suggestionText: {
    fontSize: 14,
    color: '#333',
  },
  priorityTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
    alignSelf: 'flex-start',
  },
  highPriority: {
    backgroundColor: '#f44336',
  },
  mediumPriority: {
    backgroundColor: '#ff9800',
  },
  lowPriority: {
    backgroundColor: '#4caf50',
  },
  sentimentTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
    alignSelf: 'flex-start',
  },
  positiveSentiment: {
    backgroundColor: '#4caf50',
  },
  negativeSentiment: {
    backgroundColor: '#f44336',
  },
  neutralSentiment: {
    backgroundColor: '#9e9e9e',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 12,
    color: '#1976d2',
  },
  breakdownItem: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
    marginBottom: 4,
  },
});
