package text_summarizing

import com.fasterxml.jackson.databind.ObjectMapper
import jakarta.persistence.*
import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.beans.factory.annotation.Value
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.kafka.annotation.KafkaListener
import org.springframework.kafka.core.KafkaTemplate
import org.springframework.stereotype.Repository
import org.springframework.stereotype.Service
import org.springframework.util.DigestUtils
import org.springframework.web.multipart.MultipartFile
import java.time.Instant
import java.util.*

@Entity(name = "summarized_text")
data class SummarizedTextEntity(
        @Id
        @GeneratedValue(strategy = GenerationType.IDENTITY)
        var id: Long? = null,
        @ManyToOne
        @JoinColumn(name = "user_id", referencedColumnName = "id", nullable = false)
        val user: UserEntity,
        @Column(name = "text_hash", nullable = false, length = 32)
        val textHash: String,
        @Column(name = "result_summarizing")
        var resultSummarizing: String? = null,
        @Column(name = "time_create_utc", nullable = false)
        val timeCreateUtc: Long,
        @Column(name = "time_summarizing_utc")
        var timeSummarizingUtc: Long? = null,
        @Column(name = "file_name", nullable = false)
        val fileName: String,
        @Column(name = "summarize_status", nullable = false, length = 8)
        @Enumerated(EnumType.STRING)
        var summarizeStatus: SummarizeStatus = SummarizeStatus.PENDING
)

enum class SummarizeStatus {
    PENDING,
    SUCCESS,
    ERROR
}

@Repository
interface SummarizedTextRep : JpaRepository<SummarizedTextEntity, Long> {
    fun findAllByUserOrderByTimeCreateUtcDesc(user: UserEntity, pageable: Pageable): Page<SummarizedTextEntity>
    fun findByTextHash(textHash: String): Optional<SummarizedTextEntity>
}

@Service
class SummarizeService(
        @Autowired val summarizedTextRep: SummarizedTextRep,
        @Autowired val kafkaTemplate: KafkaTemplate<String, String>,
        @Autowired val userService: UserService,
        @Autowired val objectMapper: ObjectMapper,
        @Value("\${spring.kafka.producer.topic}") val produceTopic: String
) {
    val logger: Logger = LoggerFactory.getLogger(SummarizeService::class.java)

    fun summarize(multipartFile: MultipartFile) {
        multipartFile
                .bytes
                .let(DigestUtils::md5DigestAsHex)
                .let {
                    SummarizedTextEntity(
                            user = userService.getCurrentUser(),
                            textHash = it,
                            timeCreateUtc = Instant.now().toEpochMilli(),
                            fileName = multipartFile.originalFilename ?: "<WITHOUT NAME>"
                    )
                }
                .let(summarizedTextRep::save)
                .apply { logger.info("Text with hash $textHash is saved and has id $id") }
                .let { it to KafkaSummarizeRequest(it.id!!, multipartFile.bytes.let(::String)) }
                .let { it.first to objectMapper.writeValueAsString(it.second) }
                .apply { kafkaTemplate.send(produceTopic, second) }
                .apply { logger.info("Text with hash ${first.textHash} and id ${first.id} is sent") }
    }

    @KafkaListener(topics = ["\${spring.kafka.consumer.topic}"])
    fun consumeSummarizeResult(message: String) {
        logger.info("Get result from kafka $message")
        objectMapper
                .readValue(message, KafkaSummarizeResponse::class.java)
                .let {
                    summarizedTextRep.findById(it.id).orElseThrow().apply {
                        timeSummarizingUtc = Instant.now().toEpochMilli()

                        if (it.error) {
                            logger.info("Result with id ${it.id} is failed")
                            summarizeStatus = SummarizeStatus.ERROR
                        } else {
                            logger.info("Result with id ${it.id} is success")
                            summarizeStatus = SummarizeStatus.SUCCESS
                            resultSummarizing = it.text
                        }
                    }
                }
                .let(summarizedTextRep::save)
                .apply { logger.info("Result with id $id is updated") }
    }

}

data class KafkaSummarizeRequest(val id: Long, val text: String)

data class KafkaSummarizeResponse(val id: Long, val text: String?, val error: Boolean)