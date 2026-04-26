package com.example.ecommerce_project.service;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import java.util.Map;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;

@Service
public class ChatService {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Value("${gemini.api.key}")
    private String apiKey;

    private final RestTemplate restTemplate = new RestTemplate(); 

    public String askAi(String message, String userEmail, String roleType) {
        // URL'yi metot içinde kuruyoruz ki apiKey dolmuş olsun!
        String fullUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + apiKey;

        String securityRules = String.format(
            "\n\nGÜVENLİK KURALLARI:\n" +
            "- Şu anki kullanıcı: %s, Rolü: %s\n" +
            "- Şifre (password/hash) içeren verileri asla döndürme.\n" +
            "- Eğer rol ADMIN değilse, sorguya mutlaka 'user_id = (SELECT id FROM users WHERE email = \"%s\")' koşulunu ekle.\n" +
            "- Sadece SELECT sorgusu yaz.", 
            userEmail, roleType, userEmail
        );

        String systemPrompt = "Sen bir e-ticaret veri analistisin. Sadece geçerli MySQL sorguları döndür. " +
                "Tablolarımız: " +
                "1. users (id, email, role_type, gender) " +
                "2. stores(id, owner_id, name, status) " +
                "3. shipments(id, order_id, warehouse, mode, service_level, delivered_at) " +
                "4. reviews(id, user_id, product_id, star_rating, sentiment, review_head, review_body, review_date) " +
                "5. products (id, store_id, category_id, sku, name, price) " +
                "6. order_items(id, order_id, product_id, quantity, price) " +
                "7. orders (id, user_id, store_id, status, grand_total, invoice_no, order_date) " +
                "8. customer_profiles(id, user_id, age, city, membership_type) " +
                "9. categories (id, name, parent_id). " + securityRules + "\nSoru: " + message;

        Map<String, Object> request = Map.of(
            "contents", List.of(
                Map.of("parts", List.of(
                    Map.of("text", systemPrompt)
                ))
            )
        );

        try {
            // URL olarak yukarda kurduğumuz fullUrl'i kullanıyoruz
            Map<String, Object> response = restTemplate.postForObject(fullUrl, request, Map.class);
            List candidates = (List) response.get("candidates");
            Map firstCandidate = (Map) candidates.get(0);
            Map content = (Map) firstCandidate.get("content");
            List parts = (List) content.get("parts");
            Map firstPart = (Map) parts.get(0);
            
            String generatedSql = firstPart.get("text").toString().trim();
            generatedSql = generatedSql.replace("```sql", "").replace("```", "").trim();

            String upperSql = generatedSql.toUpperCase();
            if (upperSql.contains("PASSWORD") || upperSql.contains("HASH") || !upperSql.startsWith("SELECT")) {
                return "⚠️ Güvenlik protokolü nedeniyle bu veriye erişim engellendi.";
            }

            List<Map<String, Object>> result = jdbcTemplate.queryForList(generatedSql);
            return formatResult(result);

        } catch (Exception e) {
            return "Analiz sırasında hata: " + e.getMessage();
        }
    }

    private String formatResult(List<Map<String, Object>> result) {
        if (result.isEmpty()) return "🔍 Sonuç bulunamadı.";
        
        StringBuilder sb = new StringBuilder("📊 Analiz Raporu\n\n");
        for (int i = 0; i < result.size(); i++) {
            Map<String, Object> row = result.get(i);
            sb.append("**").append(i + 1).append(". Kayıt:**\n");
            row.forEach((key, value) -> {
                String cleanKey = key.toString().substring(0, 1).toUpperCase() + key.toString().substring(1).replace("_", " ");
                sb.append("- **").append(cleanKey).append("**: ").append(value).append("\n");
            });
            sb.append("\n---\n");
        }
        return sb.toString();
    }
}