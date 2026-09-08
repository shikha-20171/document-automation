export interface TemplateFieldDefinition {
  name: string;
  label: string;
  type: string;
  required: boolean;
}

export interface TemplateItem {
  id: string | number;
  name: string;
  description?: string;
  documentType?: string;
  category?: string;
  type?: string;
  templateBody?: string;
  contentTemplate?: string;
  fields?: string[];
  fieldDefinitions?: TemplateFieldDefinition[];
  variables?: string[];
  tags?: string[];
  status?: string;
  version?: string | number;
  updatedAt?: string;
  createdAt?: string;
}

export interface CreateTemplatePayload {
  name: string;
  description?: string;
  documentType?: string;
  category?: string;
  type?: string;
  templateBody?: string;
  contentTemplate?: string;
  fields?: string[];
  fieldDefinitions?: TemplateFieldDefinition[];
  variables?: string[];
  tags?: string[];
  status?: string;
}

export interface GenerateDocFromTemplatePayload {
  templateId: string;
  documentName?: string;
  docName?: string;
  fieldValues?: Record<string, any>;
  assignedTo?: string;
}
