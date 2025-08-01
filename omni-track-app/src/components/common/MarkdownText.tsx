import React from 'react';
import { Text, View, StyleSheet } from 'react-native';

interface MarkdownTextProps {
  content: string;
  style?: any;
}

export const MarkdownText: React.FC<MarkdownTextProps> = ({ content, style }) => {
  // 简单的markdown解析器，处理常见格式
  const parseMarkdown = (text: string) => {
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let listItems: string[] = [];
    let codeBlock = false;
    let codeLines: string[] = [];
    
    const flushList = () => {
      if (listItems.length > 0) {
        elements.push(
          <View key={`list-${elements.length}`} style={styles.listContainer}>
            {listItems.map((item, index) => (
              <View key={index} style={styles.listItem}>
                <Text style={styles.listBullet}>• </Text>
                <Text style={[styles.listText, style]}>{item}</Text>
              </View>
            ))}
          </View>
        );
        listItems = [];
      }
    };

    const flushCodeBlock = () => {
      if (codeLines.length > 0) {
        elements.push(
          <View key={`code-${elements.length}`} style={styles.codeBlock}>
            <Text style={styles.codeText}>{codeLines.join('\n')}</Text>
          </View>
        );
        codeLines = [];
      }
    };

    lines.forEach((line, index) => {
      // 处理代码块
      if (line.trim().startsWith('```')) {
        if (codeBlock) {
          flushCodeBlock();
          codeBlock = false;
        } else {
          flushList();
          codeBlock = true;
        }
        return;
      }

      if (codeBlock) {
        codeLines.push(line);
        return;
      }

      // 处理列表项
      if (line.trim().match(/^[-*•]\s+/) || line.trim().match(/^\d+\.\s+/)) {
        const listText = line.trim().replace(/^[-*•]\s+/, '').replace(/^\d+\.\s+/, '');
        listItems.push(listText);
        return;
      }

      // 如果不是列表项，先处理之前的列表
      flushList();

      // 处理标题
      if (line.startsWith('### ')) {
        elements.push(
          <Text key={index} style={[styles.h3, style]}>
            {line.replace('### ', '')}
          </Text>
        );
      } else if (line.startsWith('## ')) {
        elements.push(
          <Text key={index} style={[styles.h2, style]}>
            {line.replace('## ', '')}
          </Text>
        );
      } else if (line.startsWith('# ')) {
        elements.push(
          <Text key={index} style={[styles.h1, style]}>
            {line.replace('# ', '')}
          </Text>
        );
      } else if (line.trim() === '') {
        // 空行
        elements.push(<View key={index} style={styles.spacer} />);
      } else {
        // 处理行内格式
        const processedLine = processInlineFormatting(line);
        elements.push(
          <Text key={index} style={[styles.paragraph, style]}>
            {processedLine}
          </Text>
        );
      }
    });

    // 处理最后的列表或代码块
    flushList();
    flushCodeBlock();

    return elements;
  };

  // 处理行内格式（粗体、斜体等）
  const processInlineFormatting = (text: string) => {
    // 简单的粗体处理 **text**
    const parts = text.split(/(\*\*[^*]+\*\*)/);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <Text key={index} style={styles.bold}>
            {part.slice(2, -2)}
          </Text>
        );
      }
      return part;
    });
  };

  return (
    <View style={styles.container}>
      {parseMarkdown(content)}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // 移除 flex: 1，让内容自然布局
  },
  h1: {
    fontSize: 22,
    fontWeight: 'bold',
    marginVertical: 12,
    color: '#333',
  },
  h2: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 10,
    color: '#333',
  },
  h3: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 8,
    color: '#333',
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 22,
    marginVertical: 4,
  },
  bold: {
    fontWeight: 'bold',
  },
  listContainer: {
    marginVertical: 8,
  },
  listItem: {
    flexDirection: 'row',
    marginVertical: 2,
    paddingLeft: 8,
  },
  listBullet: {
    fontSize: 16,
    color: '#666',
    marginRight: 8,
  },
  listText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
  },
  codeBlock: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#2196F3',
  },
  codeText: {
    fontFamily: 'monospace',
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  spacer: {
    height: 8,
  },
});