package text_summarizing

import com.fasterxml.jackson.databind.ObjectMapper
import jakarta.persistence.*
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
    fun summarize(multipartFile: MultipartFile) =
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
                    .let { KafkaSummarizeRequest(it.id!!, multipartFile.bytes.let(::String)) }
                    .let(objectMapper::writeValueAsString)
                    .let { kafkaTemplate.send(produceTopic, it) }
                    .let { }

    @KafkaListener(topics = ["\${spring.kafka.consumer.topic}"])
    fun consumeSummarizeResult(message: String) =
            objectMapper
                    .readValue(message, KafkaSummarizeResponse::class.java)
                    .let {
                        summarizedTextRep.findById(it.id).orElseThrow().apply {
                            timeSummarizingUtc = Instant.now().toEpochMilli()

                            if (it.error) {
                                summarizeStatus = SummarizeStatus.ERROR
                            } else {
                                summarizeStatus = SummarizeStatus.SUCCESS
                                resultSummarizing = it.text
                            }
                        }
                    }
                    .let(summarizedTextRep::save)
                    .let { }

}

data class KafkaSummarizeRequest(val id: Long, val text: String)

data class KafkaSummarizeResponse(val id: Long, val text: String?, val error: Boolean)