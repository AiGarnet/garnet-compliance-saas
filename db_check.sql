-- Check trust portal items
SELECT id, vendor_id, title, description, category, is_questionnaire_answer, questionnaire_id, created_at 
FROM trust_portal_items 
ORDER BY created_at DESC 
LIMIT 10;

-- Check vendors table
SELECT vendor_id, uuid, company_name, created_at 
FROM vendors 
ORDER BY created_at DESC 
LIMIT 5;

-- Check if the vendor f18eec97-86e9-44c4-80b7-c86461f3efbe exists
SELECT vendor_id, uuid, company_name 
FROM vendors 
WHERE uuid = 'f18eec97-86e9-44c4-80b7-c86461f3efbe';

-- Check checklist_supporting_documents
SELECT id, vendor_id, filename, file_type, uploaded_at 
FROM checklist_supporting_documents 
ORDER BY uploaded_at DESC 
LIMIT 5; 