package org.example.reviser.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Idempotent schema patches that Hibernate's ddl-auto=update won't perform on
 * its own. Hibernate reliably ADDS missing tables/columns, but it will NOT widen
 * an existing column's type — so a `reviews.notes` column first created as
 * varchar(1000) stays that width even after the entity switched to TEXT, and a
 * long solved-problem note would fail to persist.
 *
 * Running the ALTER here brings existing installs up to date. `ALTER ... TYPE
 * TEXT` is a harmless no-op when the column is already TEXT, and a missing table
 * on a brand-new database is caught and ignored (Hibernate creates it as TEXT).
 */
@Component
public class SchemaPatchRunner implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(SchemaPatchRunner.class);

    private final JdbcTemplate jdbc;

    public SchemaPatchRunner(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public void run(String... args) {
        try {
            jdbc.execute("ALTER TABLE reviews ALTER COLUMN notes TYPE TEXT");
            log.info("Schema patch OK: reviews.notes is TEXT");
        } catch (Exception e) {
            log.warn("Schema patch (reviews.notes -> TEXT) skipped: {}", e.getMessage());
        }
    }
}
