-- Unicidade case-insensitive para nome de exibição
CREATE UNIQUE INDEX "jogadores_display_name_lower_key" ON "jogadores" (LOWER("display_name"));
