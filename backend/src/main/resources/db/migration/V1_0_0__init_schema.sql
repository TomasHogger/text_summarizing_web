create table user_table (
    id VARCHAR(36) NOT NULL PRIMARY KEY
);

create table summarized_text (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    text_hash VARCHAR(32) NOT NULL,
    result_summarizing TEXT,
    time_create_utc BIGINT NOT NULL,
    time_summarizing_utc BIGINT,
    file_name VARCHAR(255) NOT NULL,

    CONSTRAINT user_id_fk FOREIGN KEY(user_id) REFERENCES user_table(id)
);

create index summarized_text_user_id_hash on summarized_text(user_id);